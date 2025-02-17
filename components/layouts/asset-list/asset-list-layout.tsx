import { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

import * as SplashScreen from "@/utils/splash-screen";
import { AssetList } from "@/components/containers/asset-list";

import { AssetListLoadingLayout } from "./asset-list-loading-layout";
import { AssetListErrorLayout } from "./asset-list-error-layout";
import { useQuery, PAGE_LIMIT } from "./query";

export const AssetListLayout: React.FC = () => {
  const { data: assets, isPending, isError } = useQuery();

  const handleLoad = useCallback(() => {
    SplashScreen.hide();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      {isPending ? (
        <AssetListLoadingLayout />
      ) : isError ? (
        <AssetListErrorLayout />
      ) : (
        <AssetList
          assets={assets}
          onLoad={SplashScreen.isHidden ? undefined : handleLoad}
          pageSize={PAGE_LIMIT}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
