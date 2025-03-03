import "react-native-reanimated";
import { Appearance } from "react-native";
import { useEffect } from "react";
import { ThemeProvider } from "@react-navigation/native";
import { setBackgroundColorAsync } from "expo-system-ui";
import { Stack } from "expo-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";

import { WhisperServiceProvider } from "@/components/contexts/whisper-service-context";
import { useTheme } from "@/hooks/use-theme";
import { colors } from "@/constants/colors";
import * as SplashScreen from "@/utils/splash-screen";

SplashScreen.preventAutoHide();
setBackgroundColorAsync(
  Appearance.getColorScheme() === "dark"
    ? colors.dark.background
    : colors.light.background
);

const queryClient = new QueryClient();
export default function RootLayout() {
  const theme = useTheme();

  // Set the app background color on theme change
  useEffect(() => {
    setBackgroundColorAsync(theme.color.background);
  }, [theme.color.background]);

  return (
    <WhisperServiceProvider>
      <ThemeProvider value={theme.navigation}>
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              contentStyle: theme.style.background,
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                contentStyle: theme.style.background,
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="asset/[id]"
              options={{
                contentStyle: theme.style.background,
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="+not-found"
              options={{
                contentStyle: theme.style.background,
                headerShown: false,
              }}
            />
          </Stack>
        </QueryClientProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </WhisperServiceProvider>
  );
}
