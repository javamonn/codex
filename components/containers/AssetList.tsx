import { useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ImageSource, Image } from "expo-image";

import { useAssetServiceContext } from "@/components/contexts/AssetsServiceContext";
import { Text } from "@/components/primitives";

function AudioItem({
  imageSource,
  title,
}: {
  imageSource: ImageSource;
  title: string;
  id: string;
}) {
  return (
    <View style={styles.audioItemContainer}>
      <Image source={imageSource} style={styles.audioItemImage} />
      <Text color="primary" size="md">
        {title}
      </Text>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

export default function AssetList() {
  const { services } = useAssetServiceContext();

  useEffect(() => {
    services.audible?.getAssets();
  }, []);

  return (
    <FlatList
      data={[]}
      renderItem={({ item }) => <AudioItem {...item} />}
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
