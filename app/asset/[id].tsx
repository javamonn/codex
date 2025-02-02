import { useLocalSearchParams } from "expo-router";

import { AssetAudioPlayer } from "@/components/containers/asset-audio-player";

export default function AssetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <AssetAudioPlayer assetId={id} />;
}
