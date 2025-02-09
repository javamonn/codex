import { useEffect, useState } from "react";
import { ThemeProvider } from "@react-navigation/native";
import { setBackgroundColorAsync } from "expo-system-ui";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AssetServiceProvider } from "@/components/contexts/AssetsServiceContext";
import { TranscriberServiceProvider } from "@/components/contexts/TranscriberContext";
import { useTheme } from "@/hooks/useTheme";
import { colors } from "@/constants/colors";
import * as SplashScreen from "@/utils/splash-screen";

SplashScreen.preventAutoHide();

setBackgroundColorAsync(colors.dark.background);

const queryClient = new QueryClient();
export default function RootLayout() {
  const theme = useTheme();

  const [isFontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [isAssetServiceInitialized, setAssetServiceInitialized] =
    useState(false);

  // Defer mounting the navigation stack until required providers and assets are ready
  const initialized = isFontsLoaded && isAssetServiceInitialized;

  // Set the app background color on theme change
  useEffect(() => {
    setBackgroundColorAsync(theme.color.background);
  }, [theme.color.background]);

  return (
    <AssetServiceProvider
      initializeOnMount
      onInitialized={() => setAssetServiceInitialized(true)}
    >
      <TranscriberServiceProvider>
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
      </TranscriberServiceProvider>
    </AssetServiceProvider>
  );
}
