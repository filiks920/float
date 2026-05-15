import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Colors } from "./constants/colors";
import OnboardingScreen from "./screens/OnboardingScreen";
import { supabase } from "./utils/supabase";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    checkAll();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAll() {
    await SecureStore.deleteItemAsync("onboarding_complete");
    const [
      {
        data: { session },
      },
      onboarding,
    ] = await Promise.all([
      supabase.auth.getSession(),
      SecureStore.getItemAsync("onboarding_complete"),
    ]);

    console.log("session:", session ? "exists" : "null");
    console.log("onboarding value:", onboarding);

    setSession(session);
    setOnboardingDone(onboarding === "true");
    setLoading(false);
  }

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

  if (!onboardingDone) {
    return (
      <OnboardingScreen
        onDone={() => {
          setOnboardingDone(true);
        }}
      />
    );
  }

  if (!session) {
    return <Redirect href={"/AuthScreen" as any} />;
  }

  return <Redirect href={"/(tabs)/home" as any} />;
}
