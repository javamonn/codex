import { StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { Image } from "expo-image";

import { Text } from "@/components/primitives/Text";
import { Pressable } from "@/components/primitives";

import { PADDING_HORIZONTAL } from "./common";

const IMAGE_SIZE = 72;
const PADDING_VERTICAL = PADDING_HORIZONTAL / 2;

// Used for flashlist estimatedItemSize
export const LIST_ITEM_VERTICAL_SIZE = IMAGE_SIZE + PADDING_VERTICAL;

export const ListItem: React.FC<{
  title: string;
  authors: string[];
  image: string;
  id: string;
  onImageDisplay?: (id: string) => void;
}> = ({ title, image, id, onImageDisplay, authors }) => {
  return (
    <Link href={`/asset/${id}`} asChild push>
      <View style={styles.root}>
        <Pressable style={styles.pressable}>
          <Image
            source={{ uri: image }}
            style={styles.image}
            recyclingKey={id}
            onDisplay={onImageDisplay ? () => onImageDisplay(id) : undefined}
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
    </Link>
  );
};

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    overflow: "hidden",
    paddingHorizontal: PADDING_HORIZONTAL / 2,
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
