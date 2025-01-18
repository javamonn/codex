import { useLocalSearchParams } from "expo-router";

export default function AssetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return null;
}
