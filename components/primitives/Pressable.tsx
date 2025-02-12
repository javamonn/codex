import {
  Pressable as NativePressable,
  PressableProps as NativePressableProps,
  useColorScheme,
} from "react-native";
import { colors, defaultColorScheme } from "@/constants/colors";

export function Pressable(props: NativePressableProps) {
  const colorScheme = useColorScheme() ?? defaultColorScheme;

  return (
    <NativePressable
      {...props}
      android_ripple={{ color: colors[colorScheme].ripple }}
    />
  );
}
