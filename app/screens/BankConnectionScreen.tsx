import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { supabase } from "../utils/supabase";

export default function BankConnectionScreen({
  onSuccess,
  userId,
}: {
  onSuccess: () => void;
  userId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("");

  async function handleManualEntry() {
    const amount = parseInt(balance.replace(/[^0-9]/g, ""));
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid balance");
      return;
    }

    setLoading(true);
    try {
      const { data: account } = await supabase
        .from("bank_accounts")
        .insert({
          user_id: userId,
          account_name: "M-Pesa",
          account_type: "mobile_money",
          balance: amount,
          currency: "KES",
          last_synced: new Date().toISOString(),
        })
        .select()
        .single();

      if (!account) throw new Error("Could not save balance");
      onSuccess();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.title}>What's your balance?</Text>
          <Text style={styles.subtitle}>
            Enter your current M-Pesa or bank balance to get your float number
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.currencyLabel}>KES</Text>
          <TextInput
            style={styles.balanceInput}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            value={balance}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, "");
              setBalance(num);
            }}
            keyboardType="numeric"
            autoFocus
          />
        </View>

        <Text style={styles.hint}>
          You can update this anytime by pulling down to refresh
        </Text>

        <TouchableOpacity
          style={[styles.button, !balance && styles.buttonDisabled]}
          onPress={handleManualEntry}
          disabled={loading || !balance}
        >
          {loading ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.buttonText}>Set my balance</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  topSection: {
    gap: 8,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
    paddingBottom: 8,
    gap: 8,
  },
  currencyLabel: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  balanceInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
});
