import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Colors } from "../constants/colors";
import { Typography } from "../constants/typography";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    emoji: "💰",
    title: "Know exactly what\nyou can spend",
    subtitle:
      "Float calculates your safe daily spending amount based on your real balance and upcoming bills.",
  },
  {
    id: "2",
    emoji: "🛡️",
    title: "Stay safe even\nwhen it is tight",
    subtitle:
      "Float warns you before you overspend. Green means safe. Amber means careful. Red means stop.",
  },
  {
    id: "3",
    emoji: "📊",
    title: "Built for gig\nworkers and hustlers",
    subtitle:
      "Irregular income? No problem. Float works with any income pattern — freelance, M-Pesa, side hustle.",
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  async function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await handleDone();
    }
  }

  async function handleDone() {
    // Mark onboarding as complete so it never shows again
    await SecureStore.setItemAsync("onboarding_complete", "true");
    onDone();
  }

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleDone}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slide content */}
      <View style={styles.slideContent}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Next / Get started button */}
      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextText}>{isLast ? "Get started" : "Next"}</Text>
      </TouchableOpacity>

      {/* Terms note */}
      {isLast && (
        <Text style={styles.termsText}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  skipBtn: {
    alignSelf: "flex-end",
    padding: 8,
  },
  skipText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
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
    marginTop: 16,
  },
});
