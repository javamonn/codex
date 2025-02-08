import { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";

import { AssetAudioPlayer } from "@/components/containers/asset-audio-player";
import { useTranscriberServiceContext } from "@/components/contexts/TranscriberContext";

export default function AssetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transcriber } = useTranscriberServiceContext();

  useEffect(() => {
    transcriber.initialize();

    return () => {
      transcriber.release();
    };
  }, []);

  return <AssetAudioPlayer assetId={id} />;
}
