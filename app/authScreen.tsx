import { router } from "expo-router";
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
import { Colors } from "./constants/colors";
import { Typography } from "./constants/typography";
import { supabase } from "./utils/supabase";
import { useTheme } from "./utils/ThemeContext";

// What this screen does:
// 1. Shows sign in form by default
// 2. User can toggle to sign up
// 3. On success, Supabase session is created
// 4. App automatically moves to Home screen

export default function AuthScreen() {
  // useState stores values that change on screen
  // [currentValue, functionToChangeIt] = useState(startingValue)

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();

  const { Colors } = useTheme();

  async function handleAuth() {
    // Validate inputs before sending to server
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Create new account
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        Alert.alert("Account created", "Welcome to Float!", [
          {
            text: "Continue",
            onPress: () => router.replace("/(tabs)/home" as any),
          },
        ]);
      } else {
        // Sign in to existing account
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/(tabs)/home" as any);
        }
        // On success app navigation happens automatically
        // via the session listener we set up in _layout.tsx
      }
    } catch (error: any) {
      // Show user friendly error messages
      Alert.alert("Error", error.message);
    } finally {
      // Always stop loading whether success or failure
      setLoading(false);
    }
  }

  return (
    // KeyboardAvoidingView pushes content up when keyboard opens
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.logo}>float</Text>
          <Text style={styles.tagline}>know what you can spend</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={Colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />

          {/* Main button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? "Create account" : "Sign in"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle between sign in and sign up */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: -2,
  },
  tagline: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 8,
    letterSpacing: 2,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 15,
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
  toggleButton: {
    alignItems: "center",
    padding: 12,
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
