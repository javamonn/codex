import { Tabs } from "expo-router";
import React, { PropsWithChildren } from "react";
import FeatherIcons from "@expo/vector-icons/Feather";
import { PressableProps, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";

const IconScalePressable: React.FC<PropsWithChildren<PressableProps>> = ({
  children,
  ...pressableProps
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, {
      damping: 10,
      stiffness: 200,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 400,
    });
  };

  return (
    <Pressable
      {...pressableProps}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={8}
      android_ripple={null}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        sceneStyle: theme.style.background,
        tabBarActiveTintColor: theme.color.textPrimary,
        tabBarInactiveTintColor: theme.color.textQuaternary,
        tabBarStyle: theme.style.tabBar,
        headerShown: false,
        tabBarButton: IconScalePressable,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          sceneStyle: theme.style.background,
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <FeatherIcons
              name="database"
              size={size}
              color={color}
              style={styles.tabBarIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          sceneStyle: theme.style.background,
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <FeatherIcons
              name="user"
              size={size}
              color={color}
              style={styles.tabBarIcon}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarIcon: {
    marginBottom: -3,
  },
});
