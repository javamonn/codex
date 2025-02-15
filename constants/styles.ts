import { StyleSheet } from "react-native";

import { colors } from "./colors";

export const darkStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.dark.background,
    borderTopWidth: 0,
    elevation: 0,
  },

  // colors
  background: {
    backgroundColor: colors.dark.background,
  },
  textPrimary: {
    color: colors.dark.textPrimary,
  },
  textSecondary: {
    color: colors.dark.textSecondary,
  },
  textTertiary: {
    color: colors.dark.textTertiary,
  },
  textQuaternary: {
    color: colors.dark.textQuaternary,
  },
});

export const lightStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.light.background,
    borderTopWidth: 0,
    elevation: 0,
  },

  // colors
  background: {
    backgroundColor: colors.light.background,
  },
  textPrimary: {
    color: colors.light.textPrimary,
  },
  textSecondary: {
    color: colors.light.textSecondary,
  },
  textTertiary: {
    color: colors.light.textTertiary,
  },
  textQuaternary: {
    color: colors.light.textQuaternary,
  },
});

export const textSizeStyles = StyleSheet.create({
  title: {
    fontSize: 32,
  },
  regular: {
    fontSize: 16,
  },
  small: {
    fontSize: 12,
  },
});

export const textWeightStyles = StyleSheet.create({
  bold: {
    fontWeight: "700",
  },
  semibold: {
    fontWeight: "600",
  },
  medium: {
    fontWeight: "500",
  },
  normal: {
    fontWeight: "400",
  },
});
