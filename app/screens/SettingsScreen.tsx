import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { supabase } from "../utils/supabase";

interface Profile {
  full_name: string;
  phone_number: string;
  currency: string;
}

export default function SettingsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone_number, currency")
        .eq("id", user.id)
        .single();
      setProfile(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => await supabase.auth.signOut(),
      },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      "Delete account",
      "This permanently deletes all your Float data. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from("profiles").delete().eq("id", user.id);
              await supabase.auth.signOut();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>
              {profile?.full_name || "Not set"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Currency</Text>
            <Text style={styles.rowValue}>{profile?.currency || "KES"}</Text>
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Dark mode</Text>
              <Text style={styles.rowSub}>Switch to dark theme</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={(val) => {
                setDarkMode(val);
                Alert.alert(
                  "Coming soon",
                  "Full dark mode support is coming in the next update.",
                );
              }}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor={Colors.background}
            />
          </View>
        </View>
      </View>

      {/* Security */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Biometric lock</Text>
              <Text style={styles.rowSub}>
                Require fingerprint to open Float
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor={Colors.background}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Auto lock</Text>
              <Text style={styles.rowSub}>Locks when app backgrounds</Text>
            </View>
            <Text style={styles.badge}>Always on</Text>
          </View>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Float alerts</Text>
              <Text style={styles.rowSub}>
                Notify when float drops below KSh 500
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor={Colors.background}
            />
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Privacy policy</Text>
            <Text style={styles.rowValue}>→</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Terms of service</Text>
            <Text style={styles.rowValue}>→</Text>
          </View>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  section: {
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 14,
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  rowSub: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowValue: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  badge: {
    fontSize: 12,
    color: Colors.accent,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  signOutBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  signOutText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  deleteText: {
    ...Typography.body,
    color: Colors.critical,
    textAlign: "center",
    padding: 12,
  },
});
