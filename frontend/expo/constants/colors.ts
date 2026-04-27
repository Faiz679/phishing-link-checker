const tintColorLight = "#0ea5e9";
const tintColorDark = "#38bdf8";

export default {
  light: {
    text: "#111827",
    background: "#ffffff",
    tint: tintColorLight,
    tabIconDefault: "#9ca3af",
    tabIconSelected: tintColorLight,
    card: "#f9fafb",
    cardBackground: "#f0f9ff",
    border: "#e5e7eb",
    secondaryText: "#6b7280",
    tertiaryText: "#9ca3af",
    inputBackground: "#f9fafb",
    iconBackground: "#f0f9ff",
  },
  dark: {
    text: "#f9fafb",
    background: "#0f172a",
    tint: tintColorDark,
    tabIconDefault: "#64748b",
    tabIconSelected: tintColorDark,
    card: "#1e293b",
    cardBackground: "#1e3a5f",
    border: "#334155",
    secondaryText: "#94a3b8",
    tertiaryText: "#64748b",
    inputBackground: "#1e293b",
    iconBackground: "#1e3a5f",
  },
};

export type Colors = typeof exportColors;

const exportColors = {
  light: {
    text: "#111827",
    background: "#ffffff",
    tint: tintColorLight,
    tabIconDefault: "#9ca3af",
    tabIconSelected: tintColorLight,
    card: "#f9fafb",
    cardBackground: "#f0f9ff",
    border: "#e5e7eb",
    secondaryText: "#6b7280",
    tertiaryText: "#9ca3af",
    inputBackground: "#f9fafb",
    iconBackground: "#f0f9ff",
  },
  dark: {
    text: "#f9fafb",
    background: "#0f172a",
    tint: tintColorDark,
    tabIconDefault: "#64748b",
    tabIconSelected: tintColorDark,
    card: "#1e293b",
    cardBackground: "#1e3a5f",
    border: "#334155",
    secondaryText: "#94a3b8",
    tertiaryText: "#64748b",
    inputBackground: "#1e293b",
    iconBackground: "#1e3a5f",
  },
};

export { exportColors };
