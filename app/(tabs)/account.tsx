import { StyleSheet, ScrollView } from "react-native";
import { Image, ImageSource } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Href, Link } from "expo-router";

import { Text } from "@/components/primitives/text";
import { Pressable } from "@/components/primitives/pressable";

type SourceItemProps = {
  source: ImageSource;
  name: string;
  href: Href;
};

const SOURCES: SourceItemProps[] = [
  {
    name: "Audible",
    source: require("../../assets/images/audible.jpg"),
    href: "/sources/audible" as Href,
  },
];

function SourceItem({ name, source, href }: SourceItemProps) {
  return (
    <Link href={href} asChild push>
      <Pressable style={styles.sourceItemContainer}>
        <Image source={source} style={styles.sourceItemImage} />
        <Text color="primary" size="regular" weight="normal">
          {name}
        </Text>
      </Pressable>
    </Link>
  );
}

export default function SourcesTab() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        {SOURCES.map((source, index) => (
          <SourceItem key={index} {...source} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sourceItemContainer: {
    flex: 1,
  },
  sourceItemImage: {
    width: 120,
    height: 120,
  },
  sourceItemText: {
    fontSize: 16,
    color: "#FFF",
  },
});
