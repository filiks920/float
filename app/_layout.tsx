import { Session } from "@supabase/supabase-js";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { CurrencyProvider } from "./utils/CurrencyContext";
import { ThemeProvider, useTheme } from "./utils/ThemeContext";
import { supabase } from "./utils/supabase";

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { Colors } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="AuthScreen" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="screens/OnboardingScreen" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <AppContent />
      </CurrencyProvider>
    </ThemeProvider>
  );
}
