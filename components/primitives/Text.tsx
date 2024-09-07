import {
  TextProps as NativeTextProps,
  Text as NativeText,
  useColorScheme,
  StyleSheet,
} from "react-native";

import { colors, defaultColorScheme } from "@/constants/colors";

type TextProps = NativeTextProps & {
  color: "primary";
  size: "md";
};

export function Text({ color, size, ...nativeTextProps }: TextProps) {
  const colorScheme = useColorScheme() ?? defaultColorScheme;
  return (
    <NativeText
      {...nativeTextProps}
      style={[
        colorStyles[`${colorScheme}.${color}`],
        sizeStyles[size],
        nativeTextProps.style,
      ]}
    >
      {nativeTextProps.children}
    </NativeText>
  );
}

type ColorStyle = Record<
  `${keyof typeof colors}.${TextProps["color"]}`,
  { color: string }
>;

const colorStyles = StyleSheet.create<ColorStyle>(
  Object.entries(colors).reduce(
    (agg, [theme, themeColors]) => ({
      ...agg,
      [`${theme}.primary`]: {
        color: themeColors.textPrimary,
      },
    }),
    {} as ColorStyle
  )
);

const sizeStyles = StyleSheet.create({
  md: { fontSize: 16 },
});
