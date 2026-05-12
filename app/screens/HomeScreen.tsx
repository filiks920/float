import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { supabase } from "../utils/supabase";
import BankConnectionScreen from "./BankConnectionScreen";

// FLOAT STATE: determines color theme
// Safe: float > dailyBasics * daysToStaySafe
// Caution: float > 0 but running low
// Critical: float <= 0 or very low

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

function getStateIcon(state: FloatState): string {
  if (state === "safe") return "🛡️";
  if (state === "caution") return "⚠️";
  return "🚨";
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

export default function HomeScreen() {
  const [userName, setUserName] = useState("");
  const [balance, setBalance] = useState(0);
  const [floatNumber, setFloatNumber] = useState(0);
  const [yesterdaySpend, setYesterdaySpend] = useState(0);
  const [dailyBasics, setDailyBasics] = useState(200);
  const [daysToStaySafe, setDaysToStaySafe] = useState(3);
  const [committedExpenses, setCommittedExpenses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [floatState, setFloatState] = useState<FloatState>("safe");

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate float state when relevant values change
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

      // Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name?.split(" ")[0] || "there");
      }

      // Accounts
      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("user_id", user.id);

      setHasAccount((accounts?.length || 0) > 0);

      const totalBalance =
        accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
      setBalance(totalBalance);

      // Committed expenses next 14 days
      const fourteenDays = new Date();
      fourteenDays.setDate(fourteenDays.getDate() + 14);

      const { data: expenses } = await supabase
        .from("committed_expenses")
        .select("*")
        .eq("user_id", user.id)
        .lte("due_date", fourteenDays.toISOString())
        .order("due_date", { ascending: true });

      setCommittedExpenses(expenses || []);

      const totalCommitted =
        expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      // Yesterday spend
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

      // Calculate float
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
  const stateIcon = getStateIcon(floatState);
  const isOnTrack = yesterdaySpend <= dailyBasics;

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
              <Text style={styles.refreshIcon}>⟳</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.updatedText}>Updated just now</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Float Number — Hero */}
      <View style={styles.floatHero}>
        <Text style={[styles.safelyUseLabel, { color: stateColor }]}>
          You can safely use
        </Text>
        <Text style={[styles.floatNumber, { color: stateColor }]}>
          {formatKES(floatNumber)}
        </Text>
        <Text style={[styles.todayLabel, { color: stateColor }]}>today</Text>
      </View>

      {/* State message card */}
      <View style={[styles.stateCard, { backgroundColor: stateBg }]}>
        <Text style={styles.stateIcon}>{stateIcon}</Text>
        <Text style={[styles.stateMessage, { color: stateColor }]}>
          {stateMessage}
        </Text>
      </View>

      {/* Days to stay safe stepper */}
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
          <TouchableOpacity>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.yesterdayIcon}>📈</Text>
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
  refreshIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  updatedText: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bellIcon: {
    fontSize: 22,
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
  stateIcon: {
    fontSize: 20,
  },
  stateMessage: {
    ...Typography.body,
    flex: 1,
    fontWeight: "500",
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
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
  editIcon: {
    fontSize: 16,
  },
  yesterdayCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  yesterdayIcon: {
    fontSize: 24,
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
