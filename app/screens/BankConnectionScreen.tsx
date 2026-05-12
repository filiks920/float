import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { supabase } from "../utils/supabase";

export default function BankConnectionScreen({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConnectBank() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      await addTestData(user.id);
      onSuccess();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTestData(userId: string) {
    const { data: account } = await supabase
      .from("bank_accounts")
      .insert({
        user_id: userId,
        account_name: "KCB M-Pesa",
        account_type: "mobile_money",
        balance: 15000,
        currency: "KES",
        last_synced: new Date().toISOString(),
      })
      .select()
      .single();

    if (!account) return;

    const now = new Date();
    await supabase.from("transactions").insert([
      {
        user_id: userId,
        account_id: account.id,
        amount: 12000,
        type: "credit",
        category: "salary",
        description: "Monthly salary",
        date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      },
      {
        user_id: userId,
        account_id: account.id,
        amount: 3500,
        type: "debit",
        category: "food",
        description: "Groceries",
        date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
      },
      {
        user_id: userId,
        account_id: account.id,
        amount: 2000,
        type: "debit",
        category: "transport",
        description: "Uber rides",
        date: new Date(now.getFullYear(), now.getMonth(), 8).toISOString(),
      },
    ]);

    await supabase.from("committed_expenses").insert([
      {
        user_id: userId,
        name: "Rent",
        amount: 8000,
        due_date: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1,
        ).toISOString(),
        recurring: true,
        recurrence_period: "monthly",
      },
      {
        user_id: userId,
        name: "Netflix",
        amount: 1100,
        due_date: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 5,
        ).toISOString(),
        recurring: true,
        recurrence_period: "monthly",
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>connect your account</Text>
        <Text style={styles.subtitle}>
          Float needs your balance and transactions to calculate your daily
          float number
        </Text>
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Your credentials are never stored. We use bank-grade encryption.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleConnectBank}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.buttonText}>connect M-Pesa / bank</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.skipText}>
          We support KCB, Equity, Co-op, M-Pesa and more
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  securityNote: {
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  securityText: {
    ...Typography.body,
    color: Colors.accent,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
  skipText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
