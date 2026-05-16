import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Typography } from "../constants/typography";
import { useCurrency } from "../utils/CurrencyContext";
import { supabase } from "../utils/supabase";
import { useTheme } from "../utils/ThemeContext";

interface Profile {
  full_name: string;
  phone_number: string;
  currency: string;
  float_alert_threshold: number;
}

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();

  console.log("SettingsScreen isDark:", isDark);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [thresholdModalVisible, setThresholdModalVisible] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedThreshold, setEditedThreshold] = useState("");
  const [saving, setSaving] = useState(false);
  const { Colors } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const CURRENCIES = ["KES", "USD", "GBP", "EUR", "UGX", "TZS"];

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
        .select("full_name, phone_number, currency, float_alert_threshold")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setEditedName(data?.full_name || "");
      setEditedThreshold(String(data?.float_alert_threshold || 500));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function saveName() {
    if (!editedName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editedName.trim() })
        .eq("id", user.id);
      if (error) throw error;
      setProfile((prev) =>
        prev ? { ...prev, full_name: editedName.trim() } : prev,
      );
      setEditModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  }
  async function saveCurrency(newCurrency: string) {
    console.log("saveCurrency called with:", newCurrency);
    await setCurrency(newCurrency);
    setProfile((prev) => (prev ? { ...prev, currency: newCurrency } : prev));
    setCurrencyModalVisible(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ currency: newCurrency })
        .eq("id", user.id);
    } catch (error) {
      console.error(error);
    }
  }

  async function saveThreshold() {
    const amount = parseInt(editedThreshold.replace(/[^0-9]/g, ""));
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ float_alert_threshold: amount })
        .eq("id", user.id);
      if (error) throw error;
      setProfile((prev) =>
        prev ? { ...prev, float_alert_threshold: amount } : prev,
      );
      setThresholdModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            router.replace("/AuthScreen" as any);
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
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
              router.replace("/AuthScreen" as any);
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
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
      fontWeight: "600" as const,
      color: Colors.textMuted,
      letterSpacing: 1.5,
      paddingHorizontal: 4,
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      overflow: "hidden" as const,
    },
    row: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      padding: 14,
    },
    rowRight: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
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
    editHint: {
      fontSize: 12,
      color: Colors.accent,
      fontWeight: "600" as const,
    },
    badge: {
      fontSize: 12,
      color: Colors.accent,
      backgroundColor: Colors.accentLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      overflow: "hidden" as const,
    },
    signOutBtn: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: "center" as const,
      borderWidth: 1,
      borderColor: Colors.border,
      marginTop: 8,
    },
    signOutText: {
      ...Typography.body,
      color: Colors.textPrimary,
      fontWeight: "600" as const,
    },
    deleteText: {
      ...Typography.body,
      color: Colors.critical,
      textAlign: "center" as const,
      padding: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "#00000066",
      justifyContent: "flex-end" as const,
    },
    modalSheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      gap: 12,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: Colors.border,
      borderRadius: 2,
      alignSelf: "center" as const,
      marginBottom: 8,
    },
    modalTitle: {
      ...Typography.title,
      color: Colors.textPrimary,
      marginBottom: 4,
    },
    modalSubtitle: {
      ...Typography.body,
      color: Colors.textSecondary,
      marginTop: -4,
    },
    modalInput: {
      backgroundColor: Colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: 14,
      fontSize: 15,
      color: Colors.textPrimary,
    },
    modalBtn: {
      backgroundColor: Colors.accent,
      borderRadius: 12,
      padding: 16,
      alignItems: "center" as const,
    },
    modalBtnText: {
      color: Colors.background,
      fontSize: 16,
      fontWeight: "700" as const,
    },
    cancelBtn: {
      alignItems: "center" as const,
      padding: 8,
    },
    cancelText: {
      ...Typography.body,
      color: Colors.textSecondary,
    },
    currencyOption: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      padding: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    currencyOptionActive: {
      borderColor: Colors.accent,
      backgroundColor: Colors.accentLight,
    },
    currencyText: {
      ...Typography.body,
      color: Colors.textPrimary,
      fontWeight: "500" as const,
    },
    currencyTextActive: {
      color: Colors.accent,
      fontWeight: "700" as const,
    },
    currencyCheck: {
      color: Colors.accent,
      fontWeight: "700" as const,
      fontSize: 16,
    },
  });

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

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              setEditedName(profile?.full_name || "");
              setEditModalVisible(true);
            }}
          >
            <Text style={styles.rowLabel}>Name</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>
                {profile?.full_name || "Not set"}
              </Text>
              <Text style={styles.editHint}>Edit</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => setCurrencyModalVisible(true)}
          >
            <Text style={styles.rowLabel}>Currency</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{profile?.currency || "KES"}</Text>
              <Text style={styles.editHint}>Edit</Text>
            </View>
          </TouchableOpacity>
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
              value={isDark}
              onValueChange={toggleTheme}
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
              <Text style={styles.rowSub}>
                Locks when app goes to background
              </Text>
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
                Notify when float drops below {profile?.currency || "KSh"}{" "}
                {profile?.float_alert_threshold || 500}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor={Colors.background}
            />
          </View>
          {notificationsEnabled && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  setEditedThreshold(
                    String(profile?.float_alert_threshold || 500),
                  );
                  setThresholdModalVisible(true);
                }}
              >
                <Text style={styles.rowLabel}>Alert threshold</Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValue}>
                    {profile?.currency || "KSh"}{" "}
                    {profile?.float_alert_threshold || 500}
                  </Text>
                  <Text style={styles.editHint}>Edit</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
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
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL("https://floatapp.co/privacy")}
          >
            <Text style={styles.rowLabel}>Privacy policy</Text>
            <Text style={styles.rowValue}>→</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL("https://floatapp.co/terms")}
        >
          <Text style={styles.rowLabel}>Terms of service</Text>
          <Text style={styles.rowValue}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete account</Text>
      </TouchableOpacity>

      {/* Edit Name Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Edit name</Text>
            <TextInput
              style={styles.modalInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Your full name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalBtn, saving && { opacity: 0.6 }]}
              onPress={saveName}
              disabled={saving}
            >
              <Text style={styles.modalBtnText}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Select currency</Text>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.currencyOption,
                  profile?.currency === c && styles.currencyOptionActive,
                ]}
                onPress={() => saveCurrency(c)}
              >
                <Text
                  style={[
                    styles.currencyText,
                    profile?.currency === c && styles.currencyTextActive,
                  ]}
                >
                  {c}
                </Text>
                {profile?.currency === c && (
                  <Text style={styles.currencyCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setCurrencyModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Threshold Modal */}
      <Modal
        visible={thresholdModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThresholdModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Alert threshold</Text>
            <Text style={styles.modalSubtitle}>
              Get notified when your float drops below this amount
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editedThreshold}
              onChangeText={(text) =>
                setEditedThreshold(text.replace(/[^0-9]/g, ""))
              }
              placeholder="e.g. 500"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalBtn, saving && { opacity: 0.6 }]}
              onPress={saveThreshold}
              disabled={saving}
            >
              <Text style={styles.modalBtnText}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setThresholdModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
