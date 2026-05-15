import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";
import { ALL_CURRENCIES, useCurrency } from "../utils/CurrencyContext";
import { useTheme } from "../utils/ThemeContext";

const SLIDES = [
  {
    id: "1",
    emoji: "💰",
    title: "Know exactly what\nyou can spend",
    subtitle:
      "Float calculates your safe daily spending amount based on your real balance and upcoming bills.",
    isCurrencyPicker: false,
  },
  {
    id: "2",
    emoji: "🛡️",
    title: "Stay safe even\nwhen it is tight",
    subtitle:
      "Float warns you before you overspend. Green means safe. Amber means careful. Red means stop.",
    isCurrencyPicker: false,
  },
  {
    id: "3",
    emoji: "📊",
    title: "Built for gig\nworkers and hustlers",
    subtitle:
      "Irregular income? No problem. Float works with any income pattern — freelance, M-Pesa, side hustle.",
    isCurrencyPicker: false,
  },
  {
    id: "4",
    emoji: "🌍",
    title: "What currency\ndo you use?",
    subtitle: "We'll use this to show all your amounts.",
    isCurrencyPicker: true,
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState("KES");
  const [currencySearch, setCurrencySearch] = useState("");
  const { setCurrency } = useCurrency();
  const { isDark } = useTheme();

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  async function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await handleDone();
    }
  }

  async function handleDone() {
    await SecureStore.setItemAsync("onboarding_complete", "true");
    setCurrency(selectedCurrency);
    onDone();
  }

  const filteredCurrencies = ALL_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase()),
  ).slice(0, 6);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 24,
    },
    skipBtn: {
      alignSelf: "flex-end",
      padding: 8,
      marginBottom: 8,
    },
    skipText: {
      ...Typography.body,
      color: Colors.textMuted,
    },
    slideContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      paddingBottom: 24,
    },
    emoji: {
      fontSize: 56,
      marginBottom: 4,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: Colors.textPrimary,
      textAlign: "center",
      lineHeight: 34,
      letterSpacing: -0.5,
    },
    subtitle: {
      ...Typography.body,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 8,
    },
    currencyPickerContainer: {
      width: "100%",
      gap: 10,
      marginTop: 4,
    },
    currencySearch: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 13,
      color: Colors.textPrimary,
      backgroundColor: Colors.surface,
    },
    currencyGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
    },
    currencyOpt: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: Colors.surface,
    },
    currencyOptActive: {
      borderColor: Colors.accent,
      backgroundColor: Colors.accentLight,
    },
    currencyOptText: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.textPrimary,
    },
    currencyOptTextActive: {
      color: Colors.accent,
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.border,
    },
    dotActive: {
      width: 24,
      backgroundColor: Colors.accent,
    },
    nextBtn: {
      backgroundColor: Colors.accent,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      width: "100%",
    },
    nextText: {
      color: Colors.background,
      fontSize: 16,
      fontWeight: "700",
    },
    termsText: {
      ...Typography.label,
      color: Colors.textMuted,
      textAlign: "center",
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleDone}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.slideContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {slide.isCurrencyPicker && (
          <View style={styles.currencyPickerContainer}>
            <TextInput
              style={styles.currencySearch}
              placeholder="Search currency..."
              placeholderTextColor={Colors.textMuted}
              value={currencySearch}
              onChangeText={setCurrencySearch}
            />
            <View style={styles.currencyGrid}>
              {filteredCurrencies.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.currencyOpt,
                    selectedCurrency === item.code && styles.currencyOptActive,
                  ]}
                  onPress={() => setSelectedCurrency(item.code)}
                >
                  <Text
                    style={[
                      styles.currencyOptText,
                      selectedCurrency === item.code &&
                        styles.currencyOptTextActive,
                    ]}
                  >
                    {item.code} · {item.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>{isLast ? "Get started" : "Next"}</Text>
        </TouchableOpacity>

        {isLast && (
          <Text style={styles.termsText}>
            By continuing you agree to our Terms of Service and Privacy Policy
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
