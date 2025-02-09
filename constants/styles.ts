import { StyleSheet, ViewStyle } from "react-native";

import { colors } from "./colors";

type ThemeStyle = {
  // Root views and layouts
  background: ViewStyle;

  // Tab bar 
  tabBar: ViewStyle;
};

export const darkStyles: ThemeStyle = StyleSheet.create({
  background: {
    backgroundColor: colors.dark.background,
  },
  tabBar: {
    backgroundColor: colors.dark.background,
    borderTopWidth: 0
  }
});

export const lightStyles: ThemeStyle = StyleSheet.create({
  background: {
    backgroundColor: colors.light.background,
  },
  tabBar: {
    backgroundColor: colors.light.background,
    borderTopWidth: 0
  }
});
