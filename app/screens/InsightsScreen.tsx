import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { supabase } from "../utils/supabase";

interface CategorySpend {
  category: string;
  total: number;
  emoji: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  food: "🍔",
  transport: "🚗",
  shopping: "🛍️",
  health: "💊",
  entertainment: "🎬",
  utilities: "💡",
  savings: "🏦",
  other: "💸",
};

function formatKES(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
}

export default function InsightsScreen() {
  const [loading, setLoading] = useState(true);
  const [avgDailySpend, setAvgDailySpend] = useState(0);
  const [dailyBasics, setDailyBasics] = useState(200);
  const [topCategories, setTopCategories] = useState<CategorySpend[]>([]);
  const [floatDaysLeft, setFloatDaysLeft] = useState(0);
  const [totalSpentThisWeek, setTotalSpentThisWeek] = useState(0);
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

      // Get user preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_basics")
        .eq("id", user.id)
        .single();

      const basics = profile?.daily_basics || 200;
      setDailyBasics(basics);

      // Get this week's transactions
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type, category, date")
        .eq("user_id", user.id)
        .eq("type", "debit")
        .gte("date", weekAgo.toISOString())
        .order("date", { ascending: false });

      const txs = transactions || [];
      const total = txs.reduce((sum, t) => sum + t.amount, 0);
      setTotalSpentThisWeek(total);

      const avg = total / 7;
      setAvgDailySpend(avg);

      if (avg > basics * 1.2) setTrend("over");
      else if (avg < basics * 0.8) setTrend("under");
      else setTrend("on");

      // Top categories
      const categoryMap: Record<string, number> = {};
      txs.forEach((t) => {
        const cat = t.category || "other";
        categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
      });

      const sorted = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, total]) => ({
          category,
          total,
          emoji: CATEGORY_EMOJIS[category] || "💸",
        }));

      setTopCategories(sorted);

      // Float days left
      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("user_id", user.id);

      const balance =
        accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

      const daysLeft = avg > 0 ? Math.floor(balance / avg) : 0;
      setFloatDaysLeft(daysLeft);
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

  const trendMessage =
    trend === "over"
      ? `You're spending ${formatKES(avgDailySpend - dailyBasics)} more than your daily basics on average. Reduce spending to stretch your float.`
      : trend === "under"
        ? `You're spending ${formatKES(dailyBasics - avgDailySpend)} less than your daily basics on average. Great discipline!`
        : "You're spending right on track with your daily basics. Keep it up.";

  const trendTitle =
    trend === "over"
      ? "⚠️ Spending too high"
      : trend === "under"
        ? "✅ Spending under control"
        : "👌 On track";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>analysing your spending...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Based on your last 7 days</Text>

      {/* Trend card */}
      <View style={[styles.trendCard, { backgroundColor: trendBg }]}>
        <Text style={[styles.trendTitle, { color: trendColor }]}>
          {trendTitle}
        </Text>
        <Text style={[styles.trendMessage, { color: trendColor }]}>
          {trendMessage}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg daily spend</Text>
          <Text style={[styles.statValue, { color: trendColor }]}>
            {formatKES(avgDailySpend)}
          </Text>
          <Text style={styles.statSub}>vs {formatKES(dailyBasics)} basics</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This week total</Text>
          <Text style={styles.statValue}>{formatKES(totalSpentThisWeek)}</Text>
          <Text style={styles.statSub}>last 7 days</Text>
        </View>
      </View>

      {/* Float days left */}
      <View style={styles.daysCard}>
        <View>
          <Text style={styles.daysLabel}>At this spend rate</Text>
          <Text style={styles.daysValue}>{floatDaysLeft} days</Text>
          <Text style={styles.daysSub}>until your balance runs out</Text>
        </View>
        <Text style={styles.daysEmoji}>
          {floatDaysLeft > 14 ? "🟢" : floatDaysLeft > 7 ? "🟡" : "🔴"}
        </Text>
      </View>

      {/* Top categories */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Top spending categories</Text>
        {topCategories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No transactions logged this week yet.
            </Text>
          </View>
        ) : (
          topCategories.map((cat, index) => {
            const pct =
              totalSpentThisWeek > 0
                ? (cat.total / totalSpentThisWeek) * 100
                : 0;
            return (
              <View key={cat.category} style={styles.catCard}>
                <View style={styles.catLeft}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <View>
                    <Text style={styles.catName}>
                      {cat.category.charAt(0).toUpperCase() +
                        cat.category.slice(1)}
                    </Text>
                    <Text style={styles.catPct}>
                      {Math.round(pct)}% of spending
                    </Text>
                  </View>
                </View>
                <Text style={styles.catAmount}>{formatKES(cat.total)}</Text>
              </View>
            );
          })
        )}
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
    paddingTop: 56,
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
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  statLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statSub: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  daysCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  daysLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  daysValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 4,
  },
  daysSub: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
  daysEmoji: {
    fontSize: 32,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
  catCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  catEmoji: {
    fontSize: 24,
  },
  catName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  catPct: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
  catAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});
