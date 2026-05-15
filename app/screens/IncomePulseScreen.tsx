import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { useCurrency } from "../utils/CurrencyContext";
import { supabase } from "../utils/supabase";

type Period = "day" | "week" | "month";

interface Transaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  category: string;
  date: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    salary: "💼",
    food: "🍔",
    transport: "🚗",
    entertainment: "🎬",
    utilities: "💡",
    rent: "🏠",
    health: "💊",
    shopping: "🛍️",
    savings: "🏦",
  };
  return map[category?.toLowerCase()] || "💸";
}

export default function ActivityScreen() {
  const [period, setPeriod] = useState<Period>("week");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    loadActivity();
  }, [period]);

  async function loadActivity() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate start date based on period
      const startDate = new Date();
      if (period === "day") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .order("date", { ascending: false });

      const txs = data || [];
      setTransactions(txs);

      const income = txs
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + t.amount, 0);

      const spent = txs
        .filter((t) => t.type === "debit")
        .reduce((sum, t) => sum + t.amount, 0);

      setTotalIn(income);
      setTotalOut(spent);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Activity</Text>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {(["day", "week", "month"] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  period === p && styles.periodTextActive,
                ]}
              >
                {p === "day"
                  ? "Today"
                  : p === "week"
                    ? "This week"
                    : "This month"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Money in / Money out */}
        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryCard, { backgroundColor: Colors.safeLight }]}
          >
            <Text style={styles.summaryIcon}>↓</Text>
            <Text style={styles.summaryLabel}>Money in</Text>
            <Text style={[styles.summaryAmount, { color: Colors.safe }]}>
              {formatAmount(totalIn)}
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: Colors.criticalLight },
            ]}
          >
            <Text style={styles.summaryIcon}>↑</Text>
            <Text style={styles.summaryLabel}>Money out</Text>
            <Text style={[styles.summaryAmount, { color: Colors.critical }]}>
              {formatAmount(totalOut)}
            </Text>
          </View>
        </View>

        {/* Net */}
        <View style={styles.netCard}>
          <Text style={styles.netLabel}>Net</Text>
          <Text
            style={[
              styles.netAmount,
              {
                color: totalIn - totalOut >= 0 ? Colors.safe : Colors.critical,
              },
            ]}
          >
            {totalIn - totalOut >= 0 ? "+" : ""}
            {formatAmount(totalIn - totalOut)}
          </Text>
        </View>

        {/* Transactions list */}
        <Text style={styles.sectionLabel}>Transactions</Text>

        {loading ? (
          <Text style={styles.loadingText}>loading...</Text>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No transactions for this period.
            </Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txLeft}>
                <Text style={styles.txEmoji}>
                  {getCategoryEmoji(tx.category)}
                </Text>
                <View>
                  <Text style={styles.txDesc}>
                    {tx.description || tx.category}
                  </Text>
                  <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  {
                    color: tx.type === "credit" ? Colors.safe : Colors.critical,
                  },
                ]}
              >
                {tx.type === "credit" ? "+" : "-"}
                {formatAmount(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
    paddingBottom: 32,
    gap: 12,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  periodText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  summaryIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  summaryLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  netCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  netLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  netAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
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
  txCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  txEmoji: {
    fontSize: 24,
  },
  txDesc: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  txDate: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
});
