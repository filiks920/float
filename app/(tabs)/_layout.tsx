import { Tabs } from "expo-router";
import { Colors } from "../constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "float",
          tabBarIcon: ({ color }) => <TabIcon symbol="◎" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pulse"
        options={{
          title: "pulse",
          tabBarIcon: ({ color }) => <TabIcon symbol="△" color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "goals",
          tabBarIcon: ({ color }) => <TabIcon symbol="◇" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "settings",
          tabBarIcon: ({ color }) => <TabIcon symbol="○" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ color, fontSize: 16 }}>{symbol}</Text>;
}

import { Text } from "react-native";

