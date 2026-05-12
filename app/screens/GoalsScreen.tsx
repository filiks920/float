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

// A goal has a name, target amount, and current amount
// Progress bar shows how close user is to goal
// Float tells user how many days to reach goal

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
  const [modalVisible, setModalVisible] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [floatNumber, setFloatNumber] = useState(0);

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

      // Get float number for days-to-goal calculation
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
      setModalVisible(false);
      loadGoals();
    } catch (error: any) {
      Alert.alert("Error", error.message);
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

  // How many days at current float to reach goal
  function daysToGoal(remaining: number): string {
    if (floatNumber <= 0) return "increase your float first";
    const days = Math.ceil(remaining / floatNumber);
    if (days <= 0) return "goal reached!";
    if (days === 1) return "1 day at your current float";
    return `${days} days at your current float`;
  }

  function formatKES(amount: number): string {
    return `KSh ${amount.toLocaleString("en-KE")}`;
  }

  // Progress percentage capped at 100
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
        <Text style={styles.title}>goals</Text>
        <Text style={styles.subtitle}>what you are saving toward</Text>

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
            return (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onLongPress={() => deleteGoal(goal.id)}
              >
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalAmount}>
                    {formatKES(goal.current_amount)} /{" "}
                    {formatKES(goal.target_amount)}
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${pct}%` as any }]}
                  />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={styles.goalPct}>
                    {Math.round(pct)}% complete
                  </Text>
                  <Text style={styles.goalDays}>{daysToGoal(remaining)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add goal button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ add goal</Text>
      </TouchableOpacity>

      {/* Add goal modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>new goal</Text>

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

            <TouchableOpacity style={styles.modalButton} onPress={addGoal}>
              <Text style={styles.modalButtonText}>save goal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>cancel</Text>
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
  },
  goalAmount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalPct: {
    ...Typography.caption,
    color: Colors.accent,
  },
  goalDays: {
    ...Typography.caption,
    color: Colors.textMuted,
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
    backgroundColor: "#000000aa",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  modalButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  modalButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    padding: 12,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
