import { useLocalSearchParams } from "expo-router";

import { AssetId } from "@/services/assets/types";
import { AssetLayout } from "@/components/layouts/asset/asset-layout";

export default function AssetScreen() {
  const { id } = useLocalSearchParams<{ id: AssetId }>();

  return <AssetLayout id={id} />;
}
