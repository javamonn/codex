import { View, StyleSheet } from "react-native";

import { Text } from "@/components/primitives/Text";
import { en } from "@/constants/strings";

import { PADDING_HORIZONTAL } from "./common";

export const Subheader: React.FC = () => {
  return (
    <View style={styles.subheader}>
      <Text size="title" color="primary" weight="semibold" style={styles.title}>
        {en.assetListTitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    lineHeight: 32,
  },
  subheader: {
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingTop: 8,
    paddingBottom: 16,
  },
});
