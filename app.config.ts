import "ts-node/register";

import { ExpoConfig } from "@expo/config";
import Color from "color";

import { colors } from "./constants/colors";

const config: ExpoConfig = {
  name: "codex",
  slug: "codex",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.javamonn.codex",
    userInterfaceStyle: "automatic",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.javamonn.codex",
    permissions: ["android.permission.MODIFY_AUDIO_SETTINGS"],
    userInterfaceStyle: "automatic",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-audio",
    "expo-font",
    [
      "expo-gradle-ext-vars",
      {
        ffmpegKitPackage: "audio",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/icon.png",
        resizeMode: "contain",
        imageWidth: 200,
        backgroundColor: Color(colors.light.background).hex(),
        dark: {
          backgroundColor: Color(colors.dark.background).hex(),
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "7fdd2fef-2200-4241-8e4d-128c61da476e",
    },
  },
};

export default config;
