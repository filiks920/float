import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { useBiometrics } from "../hooks/useBiometrics";

// This screen shows when app opens or comes back from background
// User must authenticate before seeing any financial data

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { isChecking, isSupported, authenticate } = useBiometrics();

  // Auto-trigger biometric prompt when screen appears
  useEffect(() => {
    if (!isChecking) {
      handleAuthenticate();
    }
  }, [isChecking]);

  async function handleAuthenticate() {
    const success = await authenticate();
    if (success) onUnlock();
  }

  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>float</Text>
      <Text style={styles.subtitle}>your financial co-pilot</Text>

      <View style={styles.lockIcon}>
        <Text style={styles.lockEmoji}>🔒</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAuthenticate}>
        <Text style={styles.buttonText}>
          {isSupported ? "👆 Tap to unlock" : "Open Float"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  logo: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: -2,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  lockIcon: {
    marginVertical: 32,
  },
  lockEmoji: {
    fontSize: 64,
  },
  button: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});
