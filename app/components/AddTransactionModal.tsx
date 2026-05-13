import { useState } from "react";
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

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const CATEGORIES = [
  { label: "Food", value: "food", emoji: "🍔" },
  { label: "Transport", value: "transport", emoji: "🚗" },
  { label: "Shopping", value: "shopping", emoji: "🛍️" },
  { label: "Health", value: "health", emoji: "💊" },
  { label: "Entertainment", value: "entertainment", emoji: "🎬" },
  { label: "Utilities", value: "utilities", emoji: "💡" },
  { label: "Savings", value: "savings", emoji: "🏦" },
  { label: "Other", value: "other", emoji: "💸" },
];

type TxType = "debit" | "credit";

export default function AddTransactionModal({
  visible,
  onClose,
  userId,
  onSuccess,
}: Props) {
  const [type, setType] = useState<TxType>("debit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("food");
  const [loading, setLoading] = useState(false);

  function reset() {
    setType("debit");
    setAmount("");
    setDescription("");
    setCategory("food");
  }

  async function handleSave() {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      // Get first account
      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("id, balance")
        .eq("user_id", userId)
        .limit(1);

      if (!accounts || accounts.length === 0) {
        throw new Error("No account found");
      }

      const account = accounts[0];

      // Insert transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        account_id: account.id,
        amount: amountNum,
        type,
        category,
        description: description || category,
        date: new Date().toISOString(),
      });

      // Update account balance
      const newBalance =
        type === "debit"
          ? account.balance - amountNum
          : account.balance + amountNum;

      await supabase
        .from("bank_accounts")
        .update({ balance: newBalance })
        .eq("id", account.id);

      reset();
      onClose();
      onSuccess();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Log transaction</Text>

          {/* Type toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === "debit" && styles.typeBtnActive,
                type === "debit" && { borderColor: Colors.critical },
              ]}
              onPress={() => setType("debit")}
            >
              <Text
                style={[
                  styles.typeText,
                  type === "debit" && { color: Colors.critical },
                ]}
              >
                Money out ↑
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === "credit" && styles.typeBtnActive,
                type === "credit" && { borderColor: Colors.safe },
              ]}
              onPress={() => setType("credit")}
            >
              <Text
                style={[
                  styles.typeText,
                  type === "credit" && { color: Colors.safe },
                ]}
              >
                Money in ↓
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.amountRow}>
            <Text style={styles.currency}>KSh</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />
          </View>

          {/* Description */}
          <TextInput
            style={styles.descInput}
            placeholder="Description (optional)"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />

          {/* Categories */}
          <Text style={styles.catLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.catChip,
                  category === cat.value && styles.catChipActive,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.catText,
                    category === cat.value && { color: Colors.accent },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>
              {loading ? "Saving..." : "Save transaction"}
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
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  typeBtnActive: {
    backgroundColor: Colors.background,
    borderWidth: 2,
  },
  typeText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
    paddingBottom: 8,
    gap: 8,
  },
  currency: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  descInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  catLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  catChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  catEmoji: {
    fontSize: 14,
  },
  catText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveBtnText: {
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
