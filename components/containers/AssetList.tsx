import { useRef, useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { FlashList, ListRenderItem, ViewToken } from "@shopify/flash-list";

import { Asset } from "@/services/assets/types";
import { Text, Pressable } from "@/components/primitives";

const AssetListItem: React.FC<{
  asset: Asset;
  onImageDisplay?: (id: string) => void;
}> = ({ asset, onImageDisplay }) => {
  return (
    <Link href={`/asset/${asset.id}`} asChild push>
      <Pressable style={styles.audioItemContainer}>
        <Image
          source={{ uri: asset.imageUrl }}
          style={styles.audioItemImage}
          recyclingKey={asset.id}
          onDisplay={
            onImageDisplay ? () => onImageDisplay(asset.id) : undefined
          }
        />
        <Text color="primary" size="md">
          {asset.title}
        </Text>
      </Pressable>
    </Link>
  );
};

const Separator: React.FC = () => {
  return <View style={styles.separator} />;
};

export const AssetList: React.FC<{
  assets: Asset[] | undefined;
  onLoad: (() => void) | undefined;
  pageSize: number;
}> = ({ assets, onLoad, pageSize }) => {
  // If onLoad is not provided, we don't need to track the initial image display
  const haveCalledOnLoad = useRef(!Boolean(onLoad));
  const initialImageDisplayed = useRef<{
    [id: string]: { isImageDisplayed: boolean; isViewable: boolean };
  }>({});

  // Prefetch the first page of asset images 
  useEffect(() => {
    if (!assets) {
      return;
    }

    Image.prefetch(assets.slice(0, pageSize).map((asset) => asset.imageUrl));
  }, []);

  // Call on load if all viewable images have been displayed
  const maybeCallOnLoad = useCallback(() => {
    if (
      !onLoad ||
      haveCalledOnLoad.current ||
      Object.values(initialImageDisplayed.current).some(
        (image) => image.isViewable && !image.isImageDisplayed
      )
    ) {
      return;
    }

    haveCalledOnLoad.current = true;
    initialImageDisplayed.current = {};
    onLoad();
  }, [onLoad]);

  const handleImageDisplay = useCallback((id: string) => {
    if (!onLoad || haveCalledOnLoad.current) {
      return;
    }

    const i = initialImageDisplayed.current[id];
    if (i) {
      i.isImageDisplayed = true;
    } else {
      initialImageDisplayed.current[id] = {
        isImageDisplayed: true,
        isViewable: false,
      };
    }

    maybeCallOnLoad();
  }, []);

  const renderItem: ListRenderItem<Asset> = useCallback(
    ({ item: asset }) => (
      <AssetListItem
        asset={asset}
        onImageDisplay={
          haveCalledOnLoad.current ? undefined : handleImageDisplay
        }
      />
    ),
    [handleImageDisplay]
  );
  const keyExtractor = useCallback((item: Asset) => item.id, []);
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!onLoad || haveCalledOnLoad.current) {
        return;
      }

      viewableItems.forEach(({ key }) => {
        const i = initialImageDisplayed.current[key];
        if (i) {
          i.isViewable = true;
        } else {
          initialImageDisplayed.current[key] = {
            isImageDisplayed: false,
            isViewable: true,
          };
        }
      });

      maybeCallOnLoad();
    },
    []
  );

  return (
    <FlashList
      data={assets}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onViewableItemsChanged={
        haveCalledOnLoad.current ? undefined : handleViewableItemsChanged
      }
      estimatedItemSize={60}
      ItemSeparatorComponent={Separator}
    />
  );
};

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
