export const tokens = {
  spacing: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "40px",
    "5xl": "48px",
  },

  radius: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    "3xl": "24px",
    full: "9999px",
  },

  shadow: {
    none: "none",
    xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px rgba(0, 0, 0, 0.08)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.12)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.15)",
    "2xl": "0 25px 50px rgba(0, 0, 0, 0.2)",
    inner: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
  },

  colors: {
    primary: "#ff5a36", // Brand color (orange)
    primaryLight: "#ff8c42",
    primaryDark: "#e04620",
    primaryBg: "#fff8f5",

    secondary: "#8b5cf6", // Purple
    secondaryLight: "#a78bfa",
    secondaryDark: "#6d28d9",

    success: "#10b981", // Emerald
    successLight: "#34d399",
    successDark: "#059669",

    warning: "#f59e0b", // Amber
    warningLight: "#fbbf24",
    warningDark: "#d97706",

    error: "#ef4444", // Red
    errorLight: "#f87171",
    errorDark: "#dc2626",

    info: "#3b82f6", // Blue
    infoLight: "#60a5fa",
    infoDark: "#1d4ed8",

    // Neutral grays
    neutral: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      mono: "'Monaco', 'Courier New', monospace",
    },
    fontSize: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "28px",
      "4xl": "32px",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  // Transitions
  transition: {
    fast: "150ms ease-in-out",
    base: "200ms ease-in-out",
    slow: "300ms ease-in-out",
  },

  // Breakpoints
  breakpoints: {
    xs: "320px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    auto: "auto",
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    offcanvas: 1050,
    modal: 1060,
    popover: 1070,
    tooltip: 1080,
  },

  // Border widths
  borderWidth: {
    none: "0",
    xs: "1px",
    sm: "1.5px",
    md: "2px",
    lg: "3px",
    xl: "4px",
  },
};

// Export individual token categories for easier access
export const {
  spacing,
  radius,
  shadow,
  colors,
  typography,
  transition,
  breakpoints,
  zIndex,
  borderWidth,
} = tokens;
