import { useMemo, useCallback } from "react";
import { StyleSheet } from "react-native";
import { useInfiniteQuery, infiniteQueryOptions } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { log } from "@/services/logger";
import {
  useAssetServiceContext,
  Services as AssetServices,
} from "@/components/contexts/AssetsServiceContext";
import { AssetList } from "@/components/containers/asset-list";
import { LoadingIndicator } from "@/components/primitives/LoadingIndicator";
import * as SplashScreen from "@/utils/splash-screen";

const LOGGER_SERVICE_NAME = "app/(tabs)/index";
const ASSETS_PAGE_LIMIT = 20;

export const getQueryOptions = ({
  assetServices,
}: {
  assetServices: AssetServices;
}) =>
  infiniteQueryOptions({
    queryKey: ["assets"],
    retry: false,
    queryFn: async (ctx) => {
      try {
        const data = await assetServices.audible?.getAssets({
          page: ctx.pageParam,
          limit: ASSETS_PAGE_LIMIT,
        });

        return data ?? [];
      } catch (err) {
        log({
          service: LOGGER_SERVICE_NAME,
          message: "Failed to fetch assets",
          data: { error: err, page: ctx.pageParam },
          level: "error",
        });
        throw err;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage?.length === ASSETS_PAGE_LIMIT ? pages.length : undefined,
    enabled: Boolean(assetServices.audible),
  });

const Library: React.FC = () => {
  const { services: assetServices, isInitialized } = useAssetServiceContext();
  const queryOptions = useMemo(
    () => getQueryOptions({ assetServices }),
    [assetServices]
  );
  const { data, isLoading } = useInfiniteQuery(queryOptions);

  const assets = useMemo(() => data?.pages?.flatMap((page) => page), [data]);
  const handleLoad = useCallback(() => {
    SplashScreen.hide();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      {isLoading || !isInitialized ? (
        <LoadingIndicator />
      ) : (
        <AssetList
          assets={assets}
          onLoad={SplashScreen.isHidden ? undefined : handleLoad}
          pageSize={ASSETS_PAGE_LIMIT}
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

export default Library;
