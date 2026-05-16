import { useFocusEffect } from "expo-router";
import {
  AlertOctagon,
  AlertTriangle,
  Pencil,
  RefreshCw,
  Shield,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AddExpenseModal from "../components/AddExpenseModal";
import AddTransactionModal from "../components/AddTransactionModal";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { useExpenses } from "../hooks/useExpenses";
import { useCurrency } from "../utils/CurrencyContext";

import { ALL_CURRENCIES } from "../utils/CurrencyContext";
import { scheduleDailyReminder, sendFloatAlert } from "../utils/notifications";
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
  const [accountId, setAccountId] = useState("");
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
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showUpdateBalance, setShowUpdateBalance] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(500);
  const [alertSent, setAlertSent] = useState(false);
  const { currency } = useCurrency();
  console.log("HomeScreen currency:", currency);

  function formatAmount(amount: number): string {
    const entry = ALL_CURRENCIES.find((c) => c.code === currency);
    const symbol = entry?.symbol || currency;
    return `${symbol} ${Math.round(amount).toLocaleString("en-KE")}`;
  }

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [daysInput, setDaysInput] = useState(String(daysToStaySafe));
  const [basicsInput, setBasicsInput] = useState(String(dailyBasics));
  const { expenses, addExpense, deleteExpense } = useExpenses(userId);
  const basicsRef = useRef<any>(null);
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  useEffect(() => {
    loadData();
    scheduleDailyReminder();
  }, []);

  useEffect(() => {
    const state = getFloatState(floatNumber, dailyBasics, daysToStaySafe);
    setFloatState(state);
  }, [floatNumber, dailyBasics, daysToStaySafe]);

  useEffect(() => {
    if (floatNumber > 0 && floatNumber < alertThreshold && !alertSent) {
      sendFloatAlert(floatNumber);
      setAlertSent(true);
    }
    if (floatNumber >= alertThreshold) {
      setAlertSent(false);
    }
  }, [floatNumber, alertThreshold]);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "full_name, float_alert_threshold, daily_basics, days_to_stay_safe",
        )
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name?.split(" ")[0] || "there");
        // setCurrency(profile.currency || "KES");
        if (profile.float_alert_threshold) {
          setAlertThreshold(profile.float_alert_threshold);

          if (profile.daily_basics) {
            setDailyBasics(profile.daily_basics);
            setBasicsInput(String(profile.daily_basics));
          }
          if (profile.days_to_stay_safe) {
            setDaysToStaySafe(profile.days_to_stay_safe);
            setDaysInput(String(profile.days_to_stay_safe));
          }
        }
      }

      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("id, balance")
        .eq("user_id", user.id);

      setHasAccount((accounts?.length || 0) > 0);

      if (accounts && accounts.length > 0) {
        setAccountId(accounts[0].id);
      }

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
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    setShowUpdateBanner(true);
    loadData();
  }

  async function handleUpdateBalance() {
    const amount = parseInt(newBalance.replace(/[^0-9]/g, ""));
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid balance");
      return;
    }
    setUpdatingBalance(true);
    try {
      const { error } = await supabase
        .from("bank_accounts")
        .update({ balance: amount, last_synced: new Date().toISOString() })
        .eq("id", accountId);
      if (error) throw error;
      setBalance(amount);
      setNewBalance("");
      setShowUpdateBalance(false);
      setShowUpdateBanner(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdatingBalance(false);
    }
  }
  async function saveUserPreferences(basics: number, days: number) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ daily_basics: basics, days_to_stay_safe: days })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  }

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {/* Header skeleton */}
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
          <View style={styles.skeletonBalance} />
        </View>

        {/* Hero skeleton */}
        <View style={styles.skeletonHero}>
          <View style={styles.skeletonHeroSmall} />
          <View style={styles.skeletonHeroLarge} />
          <View style={styles.skeletonHeroSmall} />
        </View>

        {/* Card skeletons */}
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
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
    <View style={styles.wrapper}>
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
            <Text style={styles.appName}>
              {userName ? `Hi, ${userName} 👋` : "Float"}
            </Text>
            <Text style={styles.balanceLabel}>Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>{formatAmount(balance)}</Text>
              <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                <RefreshCw size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {lastUpdated && (
              <Text style={styles.updatedText}>
                {lastUpdated
                  ? `Updated at ${lastUpdated.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}`
                  : "Updated just now"}
              </Text>
            )}
          </View>
        </View>

        {/* Update balance banner */}
        {showUpdateBanner && (
          <TouchableOpacity
            style={styles.updateBanner}
            onPress={() => {
              setNewBalance("");
              setShowUpdateBalance(true);
            }}
          >
            <Text style={styles.updateBannerText}>
              Balance out of date?{" "}
              <Text style={styles.updateBannerLink}>Update it</Text>
            </Text>
            <TouchableOpacity onPress={() => setShowUpdateBanner(false)}>
              <Text style={styles.updateBannerDismiss}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Float Number Hero */}
        <View style={styles.floatHero}>
          <Text style={[styles.safelyUseLabel, { color: stateColor }]}>
            You can safely use
          </Text>
          <Text style={[styles.floatNumber, { color: stateColor }]}>
            {formatAmount(floatNumber)}
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
              onPress={() => {
                const newVal = Math.max(1, daysToStaySafe - 1);
                setDaysToStaySafe(newVal);
                setDaysInput(String(newVal));
              }}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.stepperValue}
              value={daysInput}
              onChangeText={(text) => setDaysInput(text.replace(/[^0-9]/g, ""))}
              onBlur={() => {
                const num = parseInt(daysInput);
                const valid = isNaN(num) || num < 1 ? daysToStaySafe : num;
                setDaysToStaySafe(valid);
                setDaysInput(String(valid));
                saveUserPreferences(dailyBasics, valid);
              }}
              keyboardType="numeric"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => {
                const newVal = daysToStaySafe + 1;
                setDaysToStaySafe(newVal);
                setDaysInput(String(newVal));
              }}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily basics */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Daily basics</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}></Text>
            <TextInput
              ref={basicsRef}
              style={styles.basicsInput}
              value={basicsInput}
              onChangeText={(text) =>
                setBasicsInput(text.replace(/[^0-9]/g, ""))
              }
              onBlur={() => {
                const num = parseInt(basicsInput);
                const valid = isNaN(num) || num < 1 ? dailyBasics : num;
                setDailyBasics(valid);
                setBasicsInput(String(valid));
                saveUserPreferences(valid, daysToStaySafe);
              }}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={() => basicsRef.current?.focus()}>
              <Pencil size={20} color={Colors.textMuted} />
            </TouchableOpacity>
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
                    {formatAmount(expense.amount)}
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
              backgroundColor: isOnTrack
                ? Colors.safeLight
                : Colors.cautionLight,
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
                {formatAmount(yesterdaySpend)}
              </Text>
            </Text>
            <Text
              style={[
                styles.yesterdayStatus,
                { color: isOnTrack ? Colors.safe : Colors.caution },
              ]}
            >
              {yesterdaySpend === 0
                ? "Nothing logged yet — tap Log spend to record today's spending"
                : isOnTrack
                  ? "You're on track "
                  : "Spending a bit high "}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddTransaction(true)}
      >
        <Text style={styles.fabText}>
          Log spend · {formatAmount(Math.max(0, dailyBasics - yesterdaySpend))}{" "}
          left
        </Text>
      </TouchableOpacity>

      {/* Modals */}
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAdd={addExpense}
      />
      <AddTransactionModal
        visible={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        userId={userId}
        onSuccess={loadData}
      />

      {/* Update Balance Modal */}
      <Modal
        visible={showUpdateBalance}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpdateBalance(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Update balance</Text>
            <Text style={styles.modalSubtitle}>
              Current: {formatAmount(balance)}
            </Text>
            <View style={styles.balanceInputRow}>
              <Text style={styles.currencyLabel}></Text>
              <TextInput
                style={styles.balanceInputField}
                placeholder="Enter"
                placeholderTextColor={Colors.textMuted}
                value={newBalance}
                onChangeText={(text) =>
                  setNewBalance(text.replace(/[^0-9]/g, ""))
                }
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                (!newBalance || updatingBalance) && { opacity: 0.5 },
              ]}
              onPress={handleUpdateBalance}
              disabled={!newBalance || updatingBalance}
            >
              <Text style={styles.modalBtnText}>
                {updatingBalance ? "Updating..." : "Update balance"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowUpdateBalance(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 100,
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
  updateBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.cautionLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.caution,
  },
  updateBannerText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  updateBannerLink: {
    color: Colors.accent,
    fontWeight: "700",
  },
  updateBannerDismiss: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    paddingLeft: 8,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: Colors.accent,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  balanceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
    paddingBottom: 8,
    gap: 8,
  },
  currencyLabel: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  balanceInputField: {
    flex: 1,
    fontSize: 40,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  modalBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalBtnText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    alignItems: "center",
    padding: 8,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
    paddingRight: 4,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    marginRight: 4,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 56,
    gap: 16,
  },
  skeletonHeader: {
    gap: 8,
  },
  skeletonTitle: {
    width: 80,
    height: 24,
    backgroundColor: Colors.surface,
    borderRadius: 6,
  },
  skeletonSubtitle: {
    width: 60,
    height: 14,
    backgroundColor: Colors.surface,
    borderRadius: 4,
  },
  skeletonBalance: {
    width: 140,
    height: 22,
    backgroundColor: Colors.surface,
    borderRadius: 4,
  },
  skeletonHero: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  skeletonHeroSmall: {
    width: 120,
    height: 16,
    backgroundColor: Colors.surface,
    borderRadius: 4,
  },
  skeletonHeroLarge: {
    width: 200,
    height: 60,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  skeletonCard: {
    height: 64,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
});
