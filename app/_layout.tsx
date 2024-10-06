import { useEffect, useState } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";

import { AssetServiceContextProvider } from "@/components/contexts/AssetsServiceContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isFontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [isAssetServiceInitialized, setAssetServiceInitialized] =
    useState(false);

  const initialized = isFontsLoaded && isAssetServiceInitialized;

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

  return (
    <AssetServiceContextProvider
      initializeOnMount
      onInitialized={() => setAssetServiceInitialized(true)}
    >
      <ThemeProvider value={DarkTheme}>
        {initialized && (
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        )}
      </ThemeProvider>
    </AssetServiceContextProvider>
  );
}
