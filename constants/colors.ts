export const defaultColorScheme = "dark";
export const colors = {
  dark: {
    activeIcon: "rgb(255, 255, 255)",
    textPrimary: "rgb(255, 255, 255)",
    textSecondary: "rgb(227, 228, 231)",
    textTertiary: "rgb(151, 151, 154)",
    textQuaternary: "rgb(89, 90, 92)",
    ripple: "rgb(21, 22, 24)",
    background: "rgb(16, 16, 18)",
    backgroundSecondary: "rgb(27, 29, 33)",
  },
  light: {
    textPrimary: "rgb(27, 27, 27)",
    textSecondary: "rgb(48, 48, 49)",
    textTertiary: "rgb(93, 93, 95)",
    textQuaternary: "rgba(27, 27, 27, .5)",
    ripple: "rgba(21, 22, 24, 0.1)",
    background: "rgb(190, 179, 173)",
    backgroundSecondary: "rgb(170, 159, 153)",

    // old white theme colors
    // ripple: "rgb(240, 240, 240)",
    // background: "rgb(251, 251, 251)",
    // backgroundSecondary: "rgb(238, 238, 238)",
    // inactiveIcon: "rgb(158, 158, 160)",
    // textQuaternary: "rgb(158, 158, 160)",
  },
} as const;
