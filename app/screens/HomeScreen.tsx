import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  Pencil,
  RefreshCw,
  Shield,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AddExpenseModal from "../components/AddExpenseModal";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { useExpenses } from "../hooks/useExpenses";
import { supabase } from "../utils/supabase";
import BankConnectionScreen from "./BankConnectionScreen";

type FloatState = "safe" | "caution" | "critical";

function getFloatState(
  float: number,
  dailyBasics: number,
  days: number,
): FloatState {
  const needed = dailyBasics * days;
  if (float >= needed) return "safe";
  if (float > dailyBasics) return "caution";
  return "critical";
}

function getStateColor(state: FloatState): string {
  if (state === "safe") return Colors.safe;
  if (state === "caution") return Colors.caution;
  return Colors.critical;
}

function getStateBg(state: FloatState): string {
  if (state === "safe") return Colors.safeLight;
  if (state === "caution") return Colors.cautionLight;
  return Colors.criticalLight;
}

function getStateMessage(state: FloatState, days: number): string {
  if (state === "safe")
    return `This keeps you okay for ${days} days\neven if no money comes in.`;
  if (state === "caution")
    return `Careful today.\nAt this pace, you may run out in 2 days.`;
  return `You may run out tomorrow.\nReduce spending or get money in soon.`;
}

function formatKES(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
}

function calculateFloat(
  balance: number,
  committed: number,
  days: number,
): number {
  const available = balance - committed;
  if (available <= 0) return 0;
  return Math.floor(available / Math.max(days, 1));
}

function daysUntil(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  const diff = date.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function HomeScreen() {
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [balance, setBalance] = useState(0);
  const [floatNumber, setFloatNumber] = useState(0);
  const [yesterdaySpend, setYesterdaySpend] = useState(0);
  const [dailyBasics, setDailyBasics] = useState(200);
  const [daysToStaySafe, setDaysToStaySafe] = useState(3);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [floatState, setFloatState] = useState<FloatState>("safe");
  const [showAddExpense, setShowAddExpense] = useState(false);

  const { expenses, addExpense, deleteExpense } = useExpenses(userId);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const state = getFloatState(floatNumber, dailyBasics, daysToStaySafe);
    setFloatState(state);
  }, [floatNumber, dailyBasics, daysToStaySafe]);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name?.split(" ")[0] || "there");
      }

      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("user_id", user.id);

      setHasAccount((accounts?.length || 0) > 0);

      const totalBalance =
        accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
      setBalance(totalBalance);

      const fourteenDays = new Date();
      fourteenDays.setDate(fourteenDays.getDate() + 14);

      const { data: expensesData } = await supabase
        .from("committed_expenses")
        .select("*")
        .eq("user_id", user.id)
        .lte("due_date", fourteenDays.toISOString())
        .order("due_date", { ascending: true });

      const totalCommitted =
        expensesData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const { data: yesterdayTx } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .eq("type", "debit")
        .gte("date", yesterday.toISOString())
        .lte("date", yesterdayEnd.toISOString());

      const ySpend = yesterdayTx?.reduce((sum, t) => sum + t.amount, 0) || 0;
      setYesterdaySpend(ySpend);

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
        userId={userId}
        onSuccess={() => {
          setHasAccount(true);
          loadData();
        }}
      />
    );
  }

  const stateColor = getStateColor(floatState);
  const stateBg = getStateBg(floatState);
  const stateMessage = getStateMessage(floatState, daysToStaySafe);
  const isOnTrack = yesterdaySpend <= dailyBasics;
  const StateIcon =
    floatState === "safe"
      ? Shield
      : floatState === "caution"
        ? AlertTriangle
        : AlertOctagon;

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
          <Text style={styles.appName}>Float</Text>
          <Text style={styles.balanceLabel}>Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{formatKES(balance)}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
              <RefreshCw size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.updatedText}>Updated just now</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Bell size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Float Number Hero */}
      <View style={styles.floatHero}>
        <Text style={[styles.safelyUseLabel, { color: stateColor }]}>
          You can safely use
        </Text>
        <Text style={[styles.floatNumber, { color: stateColor }]}>
          {formatKES(floatNumber)}
        </Text>
        <Text style={[styles.todayLabel, { color: stateColor }]}>today</Text>
      </View>

      {/* State card */}
      <View style={[styles.stateCard, { backgroundColor: stateBg }]}>
        <StateIcon size={20} color={stateColor} />
        <Text style={[styles.stateMessage, { color: stateColor }]}>
          {stateMessage}
        </Text>
      </View>

      {/* Days to stay safe */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Days to stay safe</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setDaysToStaySafe(Math.max(1, daysToStaySafe - 1))}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{daysToStaySafe} days</Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setDaysToStaySafe(daysToStaySafe + 1)}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily basics */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Daily basics</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.basicsInput}
            value={`KSh ${dailyBasics}`}
            onChangeText={(text) => {
              const num = parseInt(text.replace(/[^0-9]/g, ""));
              if (!isNaN(num)) setDailyBasics(num);
            }}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <Pencil size={16} color={Colors.textMuted} />
        </View>
      </View>

      {/* Committed Expenses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Committed next 14 days</Text>
          <TouchableOpacity onPress={() => setShowAddExpense(true)}>
            <Text style={styles.addLink}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {expenses.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyExpense}
            onPress={() => setShowAddExpense(true)}
          >
            <Text style={styles.emptyExpenseText}>
              + Add rent, bills, subscriptions
            </Text>
            <Text style={styles.emptyExpenseSub}>
              This improves your float calculation
            </Text>
          </TouchableOpacity>
        ) : (
          expenses.map((expense) => {
            const days = daysUntil(expense.due_date);
            const isUrgent = days <= 3;
            return (
              <TouchableOpacity
                key={expense.id}
                style={styles.expenseCard}
                onLongPress={() => {
                  Alert.alert("Delete expense", `Remove ${expense.name}?`, [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => deleteExpense(expense.id),
                    },
                  ]);
                }}
              >
                <View>
                  <Text style={styles.expenseName}>{expense.name}</Text>
                  <Text
                    style={[
                      styles.expenseDue,
                      {
                        color: isUrgent
                          ? Colors.critical
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
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Yesterday feedback */}
      <View
        style={[
          styles.yesterdayCard,
          {
            backgroundColor: isOnTrack ? Colors.safeLight : Colors.cautionLight,
          },
        ]}
      >
        <View>
          <Text style={styles.yesterdayText}>
            Yesterday you used:{" "}
            <Text
              style={{
                fontWeight: "700",
                color: isOnTrack ? Colors.safe : Colors.caution,
              }}
            >
              {formatKES(yesterdaySpend)}
            </Text>
          </Text>
          <Text
            style={[
              styles.yesterdayStatus,
              { color: isOnTrack ? Colors.safe : Colors.caution },
            ]}
          >
            {yesterdaySpend === 0
              ? "No spend recorded yet"
              : isOnTrack
                ? "You're on track 👍"
                : "Spending a bit high 😅"}
          </Text>
        </View>
      </View>

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAdd={addExpense}
      />
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
    paddingBottom: 32,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  balanceLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  refreshBtn: {
    padding: 4,
  },
  updatedText: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
  floatHero: {
    alignItems: "center",
    paddingVertical: 8,
  },
  safelyUseLabel: {
    ...Typography.caption,
    fontWeight: "600",
    marginBottom: 4,
  },
  floatNumber: {
    fontSize: 56,
    fontWeight: "700",
    letterSpacing: -1,
  },
  todayLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: -4,
  },
  stateCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  stateMessage: {
    ...Typography.body,
    flex: 1,
    fontWeight: "500",
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  addLink: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: "600",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  stepperBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  stepperBtnText: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: "400",
  },
  stepperValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  basicsInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  emptyExpense: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 4,
  },
  emptyExpenseText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: "500",
  },
  emptyExpenseSub: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  expenseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expenseName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  expenseDue: {
    ...Typography.label,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  yesterdayCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  yesterdayText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  yesterdayStatus: {
    ...Typography.caption,
    marginTop: 2,
  },
});
