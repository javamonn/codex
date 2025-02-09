import { useColorScheme } from "react-native";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";

import { defaultColorScheme, colors } from "@/constants/colors";
import { darkStyles, lightStyles } from "@/constants/styles";

const darkTheme = {
  color: colors.dark,
  style: darkStyles,
  navigation: {
    ...DarkTheme,
    background: colors.dark.background,
  },
} as const;

const lightTheme = {
  color: colors.light,
  style: lightStyles,
  navigation: {
    ...DefaultTheme,
    background: colors.light.background,
  },
} as const;

export function useTheme() {
  const colorScheme = useColorScheme();

  return colorScheme ?? defaultColorScheme === "dark" ? darkTheme : lightTheme;
}
