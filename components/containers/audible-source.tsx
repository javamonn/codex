import { StyleSheet, View } from "react-native";

import { Text } from "@/components/primitives/text";

export default function AudibleSource() {
  return (
    <View style={styles.container}>
      <Text color="primary" size="regular" weight="normal">
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
