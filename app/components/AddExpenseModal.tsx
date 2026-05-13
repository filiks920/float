import { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    amount: number,
    dueDate: Date,
    recurring: boolean,
  ) => Promise<void>;
}

// Quick expense presets — common Kenyan bills
const PRESETS = [
  { name: "Rent", amount: 0 },
  { name: "Electricity", amount: 0 },
  { name: "Water", amount: 0 },
  { name: "Internet", amount: 0 },
  { name: "Netflix", amount: 0 },
  { name: "Gym", amount: 0 },
];

export default function AddExpenseModal({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDays, setDueDays] = useState("7");
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setAmount("");
    setDueDays("7");
    setRecurring(false);
  }

  async function handleAdd() {
    if (!name || !amount) {
      Alert.alert("Error", "Fill in name and amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }

    const days = parseInt(dueDays) || 7;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    setLoading(true);
    try {
      await onAdd(name, amountNum, dueDate, recurring);
      reset();
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  function selectPreset(preset: { name: string; amount: number }) {
    setName(preset.name);
    if (preset.amount > 0) setAmount(preset.amount.toString());
    setRecurring(true);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Add committed expense</Text>
          <Text style={styles.subtitle}>
            Bills and expenses that must be paid regardless
          </Text>

          {/* Presets */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetsScroll}
          >
            {PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.name}
                style={styles.presetChip}
                onPress={() => selectPreset(preset)}
              >
                <Text style={styles.presetText}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Expense name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rent, KPLC, Safaricom"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Amount (KSh)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Due in days */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Due in how many days?</Text>
            <TextInput
              style={styles.input}
              placeholder="7"
              placeholderTextColor={Colors.textMuted}
              value={dueDays}
              onChangeText={setDueDays}
              keyboardType="numeric"
            />
          </View>

          {/* Recurring toggle */}
          <View style={styles.recurringRow}>
            <View>
              <Text style={styles.recurringLabel}>Recurring monthly</Text>
              <Text style={styles.recurringSubtext}>
                Repeats every month automatically
              </Text>
            </View>
            <Switch
              value={recurring}
              onValueChange={setRecurring}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor={Colors.background}
            />
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.addBtn, loading && { opacity: 0.6 }]}
            onPress={handleAdd}
            disabled={loading}
          >
            <Text style={styles.addBtnText}>
              {loading ? "Adding..." : "Add expense"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },
  sheet: {
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
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  presetsScroll: {
    marginHorizontal: -4,
  },
  presetChip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
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
  recurringRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recurringLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  recurringSubtext: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  addBtnText: {
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
