import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { colors, defaultColorScheme } from "@/constants/colors";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors[colorScheme ?? defaultColorScheme].tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Audio",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "play-circle" : "play-circle-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sources"
        options={{
          title: "Sources",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "cloud-download" : "cloud-download-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
