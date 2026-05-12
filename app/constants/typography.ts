export const Typography = {
  // Hero number — the Float amount
  hero: {
    fontSize: 56,
    fontWeight: "700" as const,
    letterSpacing: -1,
  },
  // Screen titles
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  // Section subtitles
  subtitle: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  // Body text
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  // Small labels
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  // Tiny labels
  label: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
  },
} as const;
