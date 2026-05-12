import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { supabase } from "../utils/supabase";
import BankConnectionScreen from "./BankConnectionScreen";

function calculateFloat(
  balance: number,
  committedExpenses: number,
  daysUntilIncome: number,
): number {
  const available = balance - committedExpenses;
  if (available <= 0) return 0;
  if (daysUntilIncome <= 0) return available;
  return Math.floor(available / daysUntilIncome);
}

function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDate(): string {
  return new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [balance, setBalance] = useState(0);
  const [floatNumber, setFloatNumber] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [committedExpenses, setCommittedExpenses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        const firstName = profile.full_name?.split(" ")[0] || "there";
        setUserName(firstName);
      }

      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("user_id", user.id);

      setHasAccount((accounts?.length || 0) > 0);

      const totalBalance =
        accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
      setBalance(totalBalance);

      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      const { data: expenses } = await supabase
        .from("committed_expenses")
        .select("*")
        .eq("user_id", user.id)
        .lte("due_date", fourteenDaysFromNow.toISOString())
        .order("due_date", { ascending: true });

      setCommittedExpenses(expenses || []);

      const totalCommitted =
        expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString());

      const income =
        transactions
          ?.filter((t) => t.type === "credit")
          .reduce((sum, t) => sum + t.amount, 0) || 0;

      const spent =
        transactions
          ?.filter((t) => t.type === "debit")
          .reduce((sum, t) => sum + t.amount, 0) || 0;

      setMonthlyIncome(income);
      setMonthlyExpenses(spent);

      const dayOfMonth = new Date().getDate();
      const daysUntilIncome = Math.max(30 - dayOfMonth, 1);
      const float = calculateFloat(
        totalBalance,
        totalCommitted,
        daysUntilIncome,
      );
      setFloatNumber(float);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  function daysUntil(dateString: string): number {
    const date = new Date(dateString);
    const today = new Date();
    const diff = date.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>calculating your float...</Text>
      </View>
    );
  }

  if (!hasAccount) {
    return (
      <BankConnectionScreen
        onSuccess={() => {
          setHasAccount(true);
          loadData();
        }}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {userName}
          </Text>
          <Text style={styles.date}>{getDate()}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOut}>sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Float Number */}
      <View style={styles.floatCard}>
        <Text style={styles.floatLabel}>your float today</Text>
        <Text style={styles.floatNumber}>{formatKES(floatNumber)}</Text>
        <Text style={styles.floatSubtext}>
          what you can spend without hurting tomorrow
        </Text>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>this month in</Text>
          <Text style={[styles.summaryAmount, { color: Colors.positive }]}>
            {formatKES(monthlyIncome)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>this month out</Text>
          <Text style={[styles.summaryAmount, { color: Colors.negative }]}>
            {formatKES(monthlyExpenses)}
          </Text>
        </View>
      </View>

      {/* Committed Expenses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>committed next 14 days</Text>
        {committedExpenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No upcoming expenses. Add bills and rent to improve your float
              calculation.
            </Text>
          </View>
        ) : (
          committedExpenses.map((expense) => {
            const days = daysUntil(expense.due_date);
            const isUrgent = days <= 3;
            return (
              <View key={expense.id} style={styles.expenseCard}>
                <View>
                  <Text style={styles.expenseName}>{expense.name}</Text>
                  <Text
                    style={[
                      styles.expenseDue,
                      {
                        color: isUrgent
                          ? Colors.negative
                          : Colors.textSecondary,
                      },
                    ]}
                  >
                    {days === 0
                      ? "Due today"
                      : days === 1
                        ? "Due tomorrow"
                        : `Due in ${days} days`}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>
                  {formatKES(expense.amount)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Balance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>total balance</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceAmount}>{formatKES(balance)}</Text>
          <Text style={styles.balanceLabel}>across all accounts</Text>
        </View>
      </View>

      {/* Income Pulse Button */}
      <TouchableOpacity
        style={styles.pulseButton}
        onPress={() => router.push("/screens/IncomePulseScreen" as any)}
      >
        <Text style={styles.pulseButtonText}>📈 view income pulse</Text>
      </TouchableOpacity>
      {/* Goals Button */}
      <TouchableOpacity
        style={styles.pulseButton}
        onPress={() => router.push("/screens/GoalsScreen" as any)}
      >
        <Text style={styles.pulseButtonText}>🎯 view goals</Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  greeting: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  date: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  signOut: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  floatCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  floatLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  floatNumber: {
    fontSize: 52,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: -2,
  },
  floatSubtext: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
  expenseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expenseName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  expenseDue: {
    ...Typography.caption,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  balanceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  pulseButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  pulseButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});
