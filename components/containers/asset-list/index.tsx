import { useRef, useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import {
  FlashList,
  FlashListProps,
  ListRenderItem,
  ViewToken,
} from "@shopify/flash-list";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

import { UnionAsset } from "@/rq/union-assets/types";
import { AssetServiceId } from "@/services/assets/types";

import { PADDING_HORIZONTAL } from "./common";
import { Header } from "./header";
import { Subheader } from "./subheader";
import { ListItem, LIST_ITEM_VERTICAL_SIZE } from "./list-item";

enum CellType {
  Header = 0,
  Subheader = 1,
  Asset = 2,
}

type HeaderCell = { type: CellType.Header };
type SubheaderCell = { type: CellType.Subheader };
type AssetCell = {
  type: CellType.Asset;
  image: string;
  authors: string[];
  title: string;
  assetId: string;
  assetType: AssetServiceId;
};

type Cell = HeaderCell | SubheaderCell | AssetCell;

const AnimatedFlashList =
  Animated.createAnimatedComponent<FlashListProps<Cell>>(FlashList);

// The scrollY threshold at which the header transitions from appName to tabName
const HEADER_SCROLL_THRESHOLD = 42;

const Separator: React.FC = () => {
  return <View style={styles.separator} />;
};

const keyExtractor = (item: Cell) => {
  switch (item.type) {
    case CellType.Header:
      return "header";
    case CellType.Subheader:
      return "subheader";
    case CellType.Asset:
      return `${item.assetType}:${item.assetId}`;
  }
};

const getItemType = (item: Cell) => item.type;

export const AssetList: React.FC<{
  assets: UnionAsset[] | undefined;
  onLoad: (() => void) | undefined;
  pageSize: number;
}> = ({ assets, onLoad, pageSize }) => {
  const isTransitioned = useSharedValue(false);

  // If onLoad is not provided, we don't need to track the initial image display
  const haveCalledOnLoad = useRef(!Boolean(onLoad));
  const initialImageDisplayed = useRef<{
    [id: string]: { isImageDisplayed: boolean; isViewable: boolean };
  }>({});

  useEffect(() => {
    if (!assets) {
      return;
    }

    // Prefetch the first page of asset images
    Image.prefetch(assets.slice(0, pageSize).map((asset) => asset.imageUrl));

    // Timeout trigger the onLoad callback after 5 seconds to prevent the appearance app freeze
    let onLoadTimeout: NodeJS.Timeout | null = null;
    if (onLoad) {
      onLoadTimeout = setTimeout(() => {
        onLoad();
        haveCalledOnLoad.current = true;
      }, 5000);
    }

    return () => {
      if (onLoadTimeout) {
        clearTimeout(onLoadTimeout);
      }
    };
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

  const renderItem: ListRenderItem<Cell> = useCallback(
    ({ item }) => {
      switch (item.type) {
        case CellType.Header:
          return <Header isTransitioned={isTransitioned} />;
        case CellType.Subheader:
          return <Subheader />;
        case CellType.Asset:
          return (
            <ListItem
              title={item.title}
              authors={item.authors}
              image={item.image}
              assetId={item.assetId}
              assetType={item.assetType}
              onImageDisplay={
                haveCalledOnLoad.current ? undefined : handleImageDisplay
              }
            />
          );
      }
    },
    [handleImageDisplay, isTransitioned]
  );

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
  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (
        event.contentOffset.y > HEADER_SCROLL_THRESHOLD &&
        !isTransitioned.value
      ) {
        isTransitioned.value = true;
      } else if (
        event.contentOffset.y <= HEADER_SCROLL_THRESHOLD &&
        isTransitioned.value
      ) {
        isTransitioned.value = false;
      }
    },
  });

  const data: Cell[] = useMemo(() => {
    return [
      { type: CellType.Header },
      { type: CellType.Subheader },
      ...(assets || []).map((asset) => ({
        type: CellType.Asset,
        title: asset.title,
        image: asset.imageUrl,
        authors: asset.authors,
        assetId: asset.id,
        assetType: asset.type,
      })),
    ];
  }, [assets]);

  return (
    <AnimatedFlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onViewableItemsChanged={
        haveCalledOnLoad.current ? undefined : handleViewableItemsChanged
      }
      stickyHeaderIndices={[0]}
      estimatedItemSize={LIST_ITEM_VERTICAL_SIZE}
      getItemType={getItemType}
      ItemSeparatorComponent={Separator}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    />
  );
};

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
  subheader: {
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingVertical: 4,
  },
  contentContainer: {
    paddingHorizontal: PADDING_HORIZONTAL / 2,
  },
});
