import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Typography } from "../constants/typography";
import { useCurrency } from "../utils/CurrencyContext";
import { supabase } from "../utils/supabase";
import { useTheme } from "../utils/ThemeContext";

export default function InsightsScreen() {
  const { Colors } = useTheme();
  const { formatAmount } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [avgDailySpend, setAvgDailySpend] = useState(0);
  const [dailyBasics, setDailyBasics] = useState(200);
  const [daysLeft, setDaysLeft] = useState(0);
  const [overBudgetDays, setOverBudgetDays] = useState(0);
  const [minimumPaycheck, setMinimumPaycheck] = useState(0);
  const [weeklySpend, setWeeklySpend] = useState<number[]>([]);
  const [trend, setTrend] = useState<"over" | "under" | "on">("on");

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_basics")
        .eq("id", user.id)
        .single();

      const basics = profile?.daily_basics || 200;
      setDailyBasics(basics);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type, date")
        .eq("user_id", user.id)
        .eq("type", "debit")
        .gte("date", weekAgo.toISOString())
        .order("date", { ascending: true });

      const txs = transactions || [];

      // Build daily spend array for last 7 days
      const dailyMap: Record<string, number> = {};
      txs.forEach((t) => {
        const day = new Date(t.date).toDateString();
        dailyMap[day] = (dailyMap[day] || 0) + t.amount;
      });

      const days7: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days7.push(dailyMap[d.toDateString()] || 0);
      }
      setWeeklySpend(days7);

      const total = days7.reduce((sum, d) => sum + d, 0);
      const avg = total / 7;
      setAvgDailySpend(avg);

      const over = days7.filter((d) => d > basics).length;
      setOverBudgetDays(over);

      if (avg > basics * 1.2) setTrend("over");
      else if (avg < basics * 0.8) setTrend("under");
      else setTrend("on");

      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("user_id", user.id);

      const balance =
        accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

      setDaysLeft(avg > 0 ? Math.floor(balance / avg) : 0);
      setMinimumPaycheck(basics * 30);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const trendColor =
    trend === "over"
      ? Colors.critical
      : trend === "under"
        ? Colors.safe
        : Colors.caution;

  const trendBg =
    trend === "over"
      ? Colors.criticalLight
      : trend === "under"
        ? Colors.safeLight
        : Colors.cautionLight;

  const maxSpend = Math.max(...weeklySpend, dailyBasics, 1);
  const dayLabels = ["7d", "6d", "5d", "4d", "3d", "2d", "today"];

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: Colors.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: Colors.textSecondary }]}>
          Analysing your trajectory...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: Colors.textPrimary }]}>
        Insights
      </Text>
      <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
        Where are you headed?
      </Text>

      {/* Trend summary */}
      <View style={[styles.trendCard, { backgroundColor: trendBg }]}>
        <Text style={[styles.trendTitle, { color: trendColor }]}>
          {trend === "over"
            ? "⚠️ Spending too high"
            : trend === "under"
              ? "✅ Under control"
              : "👌 On track"}
        </Text>
        <Text style={[styles.trendMessage, { color: trendColor }]}>
          {trend === "over"
            ? `You're averaging ${formatAmount(avgDailySpend)} per day — ${formatAmount(avgDailySpend - dailyBasics)} over your daily basics. Reduce now to extend your float.`
            : trend === "under"
              ? `You're averaging ${formatAmount(avgDailySpend)} per day — ${formatAmount(dailyBasics - avgDailySpend)} under your daily basics. Excellent discipline.`
              : `You're averaging ${formatAmount(avgDailySpend)} per day, right on your daily basics. Keep it steady.`}
        </Text>
      </View>

      {/* 7-day mini chart */}
      <View
        style={[
          styles.chartCard,
          { backgroundColor: Colors.surface, borderColor: Colors.border },
        ]}
      >
        <Text style={[styles.chartTitle, { color: Colors.textSecondary }]}>
          Daily spend vs basics (7 days)
        </Text>
        <View style={styles.chart}>
          {weeklySpend.map((amount, i) => {
            const barH = (amount / maxSpend) * 80;
            const basicH = (dailyBasics / maxSpend) * 80;
            const isOver = amount > dailyBasics;
            return (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  {/* Basics line indicator */}
                  <View
                    style={[
                      styles.basicsLine,
                      {
                        bottom: basicH,
                        backgroundColor: Colors.textMuted,
                      },
                    ]}
                  />
                  {/* Spend bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barH, 2),
                        backgroundColor: isOver ? Colors.critical : Colors.safe,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: Colors.textMuted }]}>
                  {dayLabels[i]}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.chartLegend, { color: Colors.textMuted }]}>
          — basics line
        </Text>
      </View>

      {/* Key stats */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: Colors.surface, borderColor: Colors.border },
          ]}
        >
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
            Days over budget
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: overBudgetDays > 3 ? Colors.critical : Colors.safe,
              },
            ]}
          >
            {overBudgetDays}/7
          </Text>
          <Text style={[styles.statSub, { color: Colors.textMuted }]}>
            this week
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: Colors.surface, borderColor: Colors.border },
          ]}
        >
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
            Float runway
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  daysLeft > 14
                    ? Colors.safe
                    : daysLeft > 7
                      ? Colors.caution
                      : Colors.critical,
              },
            ]}
          >
            {daysLeft}d
          </Text>
          <Text style={[styles.statSub, { color: Colors.textMuted }]}>
            at current rate
          </Text>
        </View>
      </View>

      {/* Forward looking */}
      <View
        style={[
          styles.forwardCard,
          { backgroundColor: Colors.surface, borderColor: Colors.border },
        ]}
      >
        <Text style={[styles.forwardLabel, { color: Colors.textSecondary }]}>
          To cover basics next month
        </Text>
        <Text style={[styles.forwardAmount, { color: Colors.accent }]}>
          {formatAmount(minimumPaycheck)}
        </Text>
        <Text style={[styles.forwardSub, { color: Colors.textMuted }]}>
          minimum income needed
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { fontSize: 14 },
  title: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.body,
    marginTop: -8,
  },
  trendCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  trendMessage: {
    ...Typography.body,
    fontWeight: "500",
    lineHeight: 22,
  },
  chartCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  chartTitle: {
    ...Typography.label,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    gap: 8,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barTrack: {
    width: "100%",
    height: 80,
    justifyContent: "flex-end",
    position: "relative",
  },
  basicsLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 9,
  },
  chartLegend: {
    fontSize: 11,
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  statLabel: { ...Typography.label },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statSub: { ...Typography.label },
  forwardCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  forwardLabel: { ...Typography.label },
  forwardAmount: {
    fontSize: 28,
    fontWeight: "700",
  },
  forwardSub: { ...Typography.label },
});
