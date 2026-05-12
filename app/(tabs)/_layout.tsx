import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { Colors } from "../constants/colors";

function TabIcon({ emoji }: { emoji: string }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({}) => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="pulse"
        options={{
          title: "Activity",
          tabBarIcon: ({}) => <TabIcon emoji="📊" />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({}) => <TabIcon emoji="🎯" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Profile",
          tabBarIcon: ({}) => <TabIcon emoji="👤" />,
        }}
      />
    </Tabs>
  );
}
