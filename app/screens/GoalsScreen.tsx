import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
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

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [floatNumber, setFloatNumber] = useState(0);

  // Add goal modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");

  // Add money modal
  const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");

  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setGoals(data || []);

      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("user_id", user.id);

      const balance =
        accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      const { data: expenses } = await supabase
        .from("committed_expenses")
        .select("amount")
        .eq("user_id", user.id)
        .lte("due_date", fourteenDaysFromNow.toISOString());

      const committed = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const dayOfMonth = new Date().getDate();
      const daysUntilIncome = Math.max(30 - dayOfMonth, 1);
      const available = balance - committed;
      const daily = available > 0 ? Math.floor(available / daysUntilIncome) : 0;
      setFloatNumber(daily);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function addGoal() {
    if (!goalName || !goalAmount) {
      Alert.alert("Error", "Fill in all fields");
      return;
    }
    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        name: goalName,
        target_amount: amount,
        current_amount: 0,
      });
      if (error) throw error;
      setGoalName("");
      setGoalAmount("");
      setAddModalVisible(false);
      loadGoals();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  }

  async function addMoneyToGoal() {
    if (!selectedGoal || !addMoneyAmount) return;
    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const newAmount = selectedGoal.current_amount + amount;
      const { error } = await supabase
        .from("goals")
        .update({ current_amount: newAmount })
        .eq("id", selectedGoal.id);
      if (error) throw error;
      setAddMoneyAmount("");
      setAddMoneyModalVisible(false);
      setSelectedGoal(null);
      loadGoals();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editingGoal || !editName || !editAmount) {
      Alert.alert("Error", "Fill in all fields");
      return;
    }
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("goals")
        .update({ name: editName, target_amount: amount })
        .eq("id", editingGoal.id);
      if (error) throw error;
      setEditModalVisible(false);
      setEditingGoal(null);
      loadGoals();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal(id: string) {
    Alert.alert("Delete goal", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("goals").delete().eq("id", id);
          loadGoals();
        },
      },
    ]);
  }

  function daysToGoal(remaining: number): string {
    if (remaining <= 0) return "Goal reached! 🎉";
    if (floatNumber <= 0) return "Increase your float first";
    const days = Math.ceil(remaining / floatNumber);
    if (days === 1) return "1 day at your current float";
    return `${days} days at your current float`;
  }

  function formatKES(amount: number): string {
    return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
  }

  function progress(current: number, target: number): number {
    return Math.min((current / target) * 100, 100);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>loading goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Goals</Text>
        <Text style={styles.subtitle}>What you are saving toward</Text>

        {goals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No goals yet. Add something you are saving toward and Float will
              tell you how many days to get there.
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const remaining = goal.target_amount - goal.current_amount;
            const pct = progress(goal.current_amount, goal.target_amount);
            const isComplete = remaining <= 0;
            return (
              <View key={goal.id} style={styles.goalCard}>
                {/* Goal header */}
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <View style={styles.goalActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setEditingGoal(goal);
                        setEditName(goal.name);
                        setEditAmount(goal.target_amount.toString());
                        setEditModalVisible(true);
                      }}
                    >
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtnDanger}
                      onPress={() => deleteGoal(goal.id)}
                    >
                      <Text style={styles.actionBtnDangerText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Amounts */}
                <Text style={styles.goalAmount}>
                  {formatKES(goal.current_amount)}{" "}
                  <Text style={styles.goalAmountTarget}>
                    / {formatKES(goal.target_amount)}
                  </Text>
                </Text>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${pct}%` as any,
                        backgroundColor: isComplete
                          ? Colors.safe
                          : Colors.accent,
                      },
                    ]}
                  />
                </View>

                {/* Footer */}
                <View style={styles.goalFooter}>
                  <Text
                    style={[
                      styles.goalPct,
                      { color: isComplete ? Colors.safe : Colors.accent },
                    ]}
                  >
                    {Math.round(pct)}% complete
                  </Text>
                  <Text style={styles.goalDays}>{daysToGoal(remaining)}</Text>
                </View>

                {/* Add money button */}
                {!isComplete && (
                  <TouchableOpacity
                    style={styles.addMoneyBtn}
                    onPress={() => {
                      setSelectedGoal(goal);
                      setAddMoneyAmount("");
                      setAddMoneyModalVisible(true);
                    }}
                  >
                    <Text style={styles.addMoneyBtnText}>+ Add money</Text>
                  </TouchableOpacity>
                )}

                {isComplete && (
                  <View style={styles.completeBadge}>
                    <Text style={styles.completeBadgeText}>
                      🎉 Goal reached!
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add goal FAB */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setGoalName("");
          setGoalAmount("");
          setAddModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Add Goal</Text>
      </TouchableOpacity>

      {/* Add Goal Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>New goal</Text>
            <TextInput
              style={styles.input}
              placeholder="Goal name (e.g. New laptop)"
              placeholderTextColor={Colors.textMuted}
              value={goalName}
              onChangeText={setGoalName}
            />
            <TextInput
              style={styles.input}
              placeholder="Target amount (KSh)"
              placeholderTextColor={Colors.textMuted}
              value={goalAmount}
              onChangeText={setGoalAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.modalBtn, saving && { opacity: 0.6 }]}
              onPress={addGoal}
              disabled={saving}
            >
              <Text style={styles.modalBtnText}>
                {saving ? "Saving..." : "Save goal"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Money Modal */}
      <Modal
        visible={addMoneyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddMoneyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>
              Add money to {selectedGoal?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Current: {formatKES(selectedGoal?.current_amount || 0)} /{" "}
              {formatKES(selectedGoal?.target_amount || 0)}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Amount to add (KSh)"
              placeholderTextColor={Colors.textMuted}
              value={addMoneyAmount}
              onChangeText={setAddMoneyAmount}
              keyboardType="numeric"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalBtn, saving && { opacity: 0.6 }]}
              onPress={addMoneyToGoal}
              disabled={saving}
            >
              <Text style={styles.modalBtnText}>
                {saving ? "Saving..." : "Add money"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setAddMoneyModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Edit goal</Text>
            <TextInput
              style={styles.input}
              placeholder="Goal name"
              placeholderTextColor={Colors.textMuted}
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={styles.input}
              placeholder="Target amount (KSh)"
              placeholderTextColor={Colors.textMuted}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.modalBtn, saving && { opacity: 0.6 }]}
              onPress={saveEdit}
              disabled={saving}
            >
              <Text style={styles.modalBtnText}>
                {saving ? "Saving..." : "Save changes"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setEditModalVisible(false)}
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
    gap: 12,
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
    marginTop: -4,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalName: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    flex: 1,
  },
  goalActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  actionBtnText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: "600",
  },
  actionBtnDanger: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.critical,
  },
  actionBtnDangerText: {
    fontSize: 12,
    color: Colors.critical,
    fontWeight: "600",
  },
  goalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  goalAmountTarget: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalPct: {
    ...Typography.caption,
    fontWeight: "600",
  },
  goalDays: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  addMoneyBtn: {
    backgroundColor: Colors.accentLight,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  addMoneyBtnText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  completeBadge: {
    backgroundColor: Colors.safeLight,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  completeBadgeText: {
    color: Colors.safe,
    fontSize: 14,
    fontWeight: "600",
  },
  addButton: {
    position: "absolute",
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: Colors.background,
    fontSize: 16,
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
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  modalBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
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
});
