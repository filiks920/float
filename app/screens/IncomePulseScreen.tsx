import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { supabase } from "../utils/supabase";

// Income Pulse shows:
// 1. Last 4 weeks of income as visual bars
// 2. Prediction of next income window
// 3. Warning if dry spell is coming

interface WeekData {
  week: string;
  amount: number;
  isCurrentWeek: boolean;
}

export default function IncomePulseScreen() {
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
  const [nextIncomeEstimate, setNextIncomeEstimate] = useState(0);
  const [drySpellWarning, setDrySpellWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncomeData();
  }, []);

  async function loadIncomeData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 4 weeks of credit transactions
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, date, type")
        .eq("user_id", user.id)
        .eq("type", "credit")
        .gte("date", fourWeeksAgo.toISOString())
        .order("date", { ascending: true });

      // Group transactions by week
      const weeks: WeekData[] = [];
      const now = new Date();

      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(now.getDate() - i * 7 - 7);
        const weekEnd = new Date();
        weekEnd.setDate(now.getDate() - i * 7);

        const weekTotal =
          transactions
            ?.filter((t) => {
              const date = new Date(t.date);
              return date >= weekStart && date < weekEnd;
            })
            .reduce((sum, t) => sum + t.amount, 0) || 0;

        weeks.push({
          week:
            i === 0 ? "this week" : i === 1 ? "last week" : `${i * 7} days ago`,
          amount: weekTotal,
          isCurrentWeek: i === 0,
        });
      }

      setWeeklyData(weeks);

      // Calculate average weekly income
      const totalIncome = weeks.reduce((sum, w) => sum + w.amount, 0);
      const avgWeekly = totalIncome / 4;
      setNextIncomeEstimate(avgWeekly);

      // Dry spell warning if current week is below 30% of average
      const currentWeek = weeks[3].amount;
      if (currentWeek < avgWeekly * 0.3 && avgWeekly > 0) {
        setDrySpellWarning(true);
      }
    } catch (error) {
      console.error("Error loading income data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Find max amount for bar chart scaling
  const maxAmount = Math.max(...weeklyData.map((w) => w.amount), 1);

  function formatKES(amount: number): string {
    return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>reading your income pulse...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.title}>Income pulse</Text>
      <Text style={styles.subtitle}>Your earning pattern over 4 weeks</Text>

      {/* Dry spell warning */}
      {drySpellWarning && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Dry spell ahead</Text>
          <Text style={styles.warningText}>
            Your income this week is lower than usual. Your float may tighten
            soon.
          </Text>
        </View>
      )}

      {/* Weekly bar chart */}
      <View style={styles.chartCard}>
        <View style={styles.barsContainer}>
          {weeklyData.map((week, index) => {
            const barHeight =
              maxAmount > 0 ? (week.amount / maxAmount) * 120 : 4;

            return (
              <View key={index} style={styles.barWrapper}>
                <Text style={styles.barAmount}>
                  {week.amount > 0 ? formatKES(week.amount) : "-"}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor: week.isCurrentWeek
                          ? Colors.accent
                          : Colors.surface,
                        borderColor: week.isCurrentWeek
                          ? Colors.accent
                          : Colors.border,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    week.isCurrentWeek && { color: Colors.accent },
                  ]}
                >
                  {week.week}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Next income estimate */}
      <View style={styles.estimateCard}>
        <Text style={styles.estimateLabel}>Estimated next week</Text>
        <Text style={styles.estimateAmount}>
          {formatKES(nextIncomeEstimate)}
        </Text>
        <Text style={styles.estimateNote}>Based on your 4-week average</Text>
      </View>

      {/* Income tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>What this means</Text>
        <Text style={styles.tipsText}>
          Your float number is calculated using these income patterns. More
          consistent income = more accurate float.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  warningCard: {
    backgroundColor: "#FFB80022",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  warningTitle: {
    ...Typography.subtitle,
    color: Colors.warning,
    marginBottom: 4,
  },
  warningText: {
    ...Typography.body,
    color: Colors.warning,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  barAmount: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: "center",
  },
  barTrack: {
    width: "60%",
    height: 120,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  estimateCard: {
    backgroundColor: Colors.accentDim,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  estimateLabel: {
    ...Typography.caption,
    color: Colors.accent,
    letterSpacing: 1,
  },
  estimateAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.accent,
    marginVertical: 4,
  },
  estimateNote: {
    ...Typography.caption,
    color: Colors.accent,
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  tipsText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
