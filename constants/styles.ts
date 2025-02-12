import { StyleSheet } from "react-native";

import { colors } from "./colors";

export const darkStyles = StyleSheet.create({
  background: {
    backgroundColor: colors.dark.background,
  },
  tabBar: {
    backgroundColor: colors.dark.background,
    borderTopWidth: 0,
    elevation: 0
  }
});

export const lightStyles = StyleSheet.create({
  background: {
    backgroundColor: colors.light.background,
  },
  tabBar: {
    backgroundColor: colors.light.background,
    borderTopWidth: 0,
    elevation: 0
  }
});
