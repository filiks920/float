export const Colors = {
  // Backgrounds
  background: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceRaised: "#F1F5F9",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",

  // Brand — Float green
  accent: "#16A34A",
  accentLight: "#DCFCE7",
  accentDim: "#16A34A22",

  // Semantic states
  safe: "#16A34A",
  safeLight: "#DCFCE7",
  caution: "#F59E0B",
  cautionLight: "#FEF3C7",
  critical: "#DC2626",
  criticalLight: "#FEE2E2",

  // Neutral
  positive: "#16A34A",
  negative: "#DC2626",
  warning: "#F59E0B",

  // Border
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // Dark mode equivalents (used when dark mode enabled)
  dark: {
    background: "#0a0a0a",
    surface: "#141414",
    surfaceRaised: "#1c1c1c",
    textPrimary: "#ffffff",
    textSecondary: "#888888",
    textMuted: "#444444",
    border: "#222222",
  },
} as const;
