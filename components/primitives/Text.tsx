import {
  TextProps as NativeTextProps,
  Text as NativeText,
  TextStyle,
} from "react-native";

import { textSizeStyles, textWeightStyles } from "@/constants/styles";
import { useTheme } from "@/hooks/useTheme";

type TextProps = NativeTextProps & {
  color: "primary" | "secondary" | "tertiary" | "quaternary";
  size: keyof typeof textSizeStyles;
  weight: keyof typeof textWeightStyles;
};

const getColorStyle = (
  color: TextProps["color"],
  theme: ReturnType<typeof useTheme>
): TextStyle => {
  switch (color) {
    case "primary":
      return theme.style.textPrimary;
    case "secondary":
      return theme.style.textSecondary;
    case "tertiary":
      return theme.style.textTertiary;
    case "quaternary":
      return theme.style.textQuaternary;
  }
};

export function Text({ color, size, weight, ...nativeTextProps }: TextProps) {
  const theme = useTheme();

  return (
    <NativeText
      {...nativeTextProps}
      style={[
        getColorStyle(color, theme),
        textSizeStyles[size],
        textWeightStyles[weight],
        nativeTextProps.style,
      ]}
    >
      {nativeTextProps.children}
    </NativeText>
  );
}
