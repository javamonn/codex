import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";

import { Text } from "@/components/primitives/text";
import { Pressable } from "@/components/primitives/pressable";
import { AssetServiceId } from "@/rq/asset-services/types";
import { makeHref } from "@/app/asset/[assetType]/[assetId]";

import { PADDING_HORIZONTAL } from "./common";

const IMAGE_SIZE = 72;
const PADDING_VERTICAL = PADDING_HORIZONTAL / 2;

// Used for flashlist estimatedItemSize
export const LIST_ITEM_VERTICAL_SIZE = IMAGE_SIZE + PADDING_VERTICAL;

export const ListItem: React.FC<{
  title: string;
  authors: string[];
  image: string;
  assetId: string;
  assetType: AssetServiceId;
  onImageDisplay?: (id: string) => void;
}> = ({ title, image, assetId, assetType, onImageDisplay, authors }) => {
  const globalId = `${assetType}:${assetId}`;

  const handlePress = useCallback(() => {
    router.push(makeHref({ assetId, assetType }));
  }, [router.push, assetId, assetType]);

  return (
    <View style={styles.root}>
      <Pressable
        style={styles.pressable}
        onPress={handlePress}
        unstable_pressDelay={50}
      >
        <Image
          source={{ uri: image }}
          style={styles.image}
          recyclingKey={globalId}
          onDisplay={
            onImageDisplay ? () => onImageDisplay(globalId) : undefined
          }
        />
        <View style={styles.textContainer}>
          <Text color="primary" size="regular" weight="medium">
            {title}
          </Text>
          <Text color="secondary" size="small" weight="normal">
            {authors.join(", ")}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    overflow: "hidden",
    marginHorizontal: PADDING_HORIZONTAL / 2,
  },
  pressable: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: PADDING_HORIZONTAL / 2,
    paddingVertical: PADDING_VERTICAL,
  },
  textContainer: {
    flexDirection: "column",
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 4,
  },
});
