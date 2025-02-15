import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  useAnimatedStyle,
  SharedValue,
  withSpring,
} from "react-native-reanimated";

import { Text } from "@/components/primitives/Text";
import { useTheme } from "@/hooks/useTheme";
import { en } from "@/constants/strings";
import { PADDING_HORIZONTAL } from "./common";

const SPRING_CONFIG = {
  damping: 20,
  mass: 0.8,
  stiffness: 180,
};

export const Header: React.FC<{
  isTransitioned: SharedValue<boolean>;
}> = ({ isTransitioned }) => {
  const theme = useTheme();

  const animatedCodexStyle = useAnimatedStyle(() => {
    const translateY = withSpring(
      isTransitioned.value ? -32 : 0,
      SPRING_CONFIG
    );
    const opacity = withSpring(isTransitioned.value ? 0 : 1, SPRING_CONFIG);

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const animatedLibraryStyle = useAnimatedStyle(() => {
    const translateY = withSpring(isTransitioned.value ? 0 : 32, SPRING_CONFIG);
    const opacity = withSpring(isTransitioned.value ? 1 : 0, SPRING_CONFIG);

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <View style={[styles.header, theme.style.background]}>
      <Animated.View style={[styles.headerTitle, animatedCodexStyle]}>
        <Text size="regular" color="quaternary" weight="medium">
          {en.appName}
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.headerTitle,
          styles.headerTitleAbsolute,
          animatedLibraryStyle,
        ]}
      >
        <Text size="regular" color="quaternary" weight="medium">
          {en.assetListTitle}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    position: "relative",
    height: 32,
    justifyContent: "center",
  },
  headerTitleAbsolute: {
    position: "absolute",
    top: 0,
    left: PADDING_HORIZONTAL,
    right: PADDING_HORIZONTAL,
    bottom: 0,
    justifyContent: "center",
  },
  header: {
    height: 32,
    paddingHorizontal: PADDING_HORIZONTAL,
    position: "relative",
    zIndex: 1,
    overflow: "hidden",
  },
});
