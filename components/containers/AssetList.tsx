import { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useInfiniteQuery, infiniteQueryOptions } from "@tanstack/react-query";

import {
  useAssetServiceContext,
  Services as AssetServices,
} from "@/components/contexts/AssetsServiceContext";
import { Asset } from "@/services/assets/types";
import { Text } from "@/components/primitives";

function AssetListItem({ asset }: { asset: Asset }) {
  return (
    <View style={styles.audioItemContainer}>
      <Image source={{ uri: asset.imageUrl }} style={styles.audioItemImage} />
      <Text color="primary" size="md">
        {asset.title}
      </Text>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const ASSETS_PAGE_LIMIT = 20;
export const getQueryOptions = ({
  assetServices,
}: {
  assetServices: AssetServices;
}) =>
  infiniteQueryOptions({
    queryKey: ["assets"],
    queryFn: (ctx) =>
      assetServices.audible?.getAssets({
        page: ctx.pageParam,
        limit: ASSETS_PAGE_LIMIT,
      }) ?? [],
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage?.length === ASSETS_PAGE_LIMIT ? pages.length : undefined,
  });

export default function AssetList() {
  const { services: assetServices } = useAssetServiceContext();

  const queryOptions = useMemo(
    () => getQueryOptions({ assetServices }),
    [assetServices]
  );

  const { data } = useInfiniteQuery(queryOptions);
  const assetItems = useMemo(
    () => data?.pages?.flatMap((page) => page),
    [data]
  );

  return (
    <FlatList
      data={assetItems}
      renderItem={({ item: asset }) => <AssetListItem asset={asset} />}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={Separator}
    />
  );
}

const styles = StyleSheet.create({
  audioItemContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioItemImage: {
    width: 60,
    height: 60,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
});
