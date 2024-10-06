import { StyleSheet, View } from "react-native";
import { Text } from "@/components/primitives";

import { useAssetServiceContext } from "@/components/contexts/AssetsServiceContext";

export default function AudibleSource() {
  // const { services } = useAssetServiceContext();

  return (
    <View style={styles.container}>
      <Text color="primary" size="md">
        Registered Audible Source
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
