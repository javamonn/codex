import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageSource, Image } from "expo-image";
import { Text } from "@/components/primitives";

type AudioItemProps = {
  imageSource: ImageSource;
  title: string;
  id: string;
};

// TODO: load synced audio from sqlite
const makeData = (idx: number): AudioItemProps => ({
  id: String(idx),
  title: `Item ${idx}`,
  imageSource: require("../../assets/images/audible.jpg"),
});
const DATA = Array.from({ length: 40 }, (_, idx) => makeData(idx));

function AudioItem({ imageSource, title }: AudioItemProps) {
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

export default function Audio() {
  return (
    <SafeAreaView>
      <FlatList
        data={DATA}
        renderItem={({ item }) => <AudioItem {...item} />}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Separator}
      />
    </SafeAreaView>
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
