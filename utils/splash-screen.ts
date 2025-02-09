import { SplashScreen } from "expo-router";

export let isHidden = false;

export const preventAutoHide = async () => {
  // This does not work correctly in Android debug builds:
  // https://expo.dev/changelog/2024/11-12-sdk-52#known-limitations-of-splash-screen-implementation
  SplashScreen.preventAutoHideAsync();
};

export const hide = () => {
  if (!isHidden) {
    SplashScreen.hide();
    isHidden = true;
  }
};
