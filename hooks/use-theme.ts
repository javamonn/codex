import { useColorScheme } from "react-native";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";

import { defaultColorScheme, colors } from "@/constants/colors";
import { darkStyles, lightStyles } from "@/constants/styles";

const darkTheme = {
  color: colors.dark,
  style: darkStyles,
  navigation: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.dark.background,
      text: colors.dark.textPrimary,
    },
  },
} as const;

const lightTheme = {
  color: colors.light,
  style: lightStyles,
  navigation: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.light.background,
      text: colors.light.textPrimary,
    },
  },
} as const;

export function useTheme() {
  const colorScheme = useColorScheme();

  return (colorScheme ?? defaultColorScheme) === "dark"
    ? darkTheme
    : lightTheme;
}
