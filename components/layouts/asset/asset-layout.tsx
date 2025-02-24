import { StyleSheet } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { SafeAreaView } from "react-native-safe-area-context";

import { useQuery as useAssetQuery } from "@/rq/asset/query";
import { useQuery as useAssetAudioSourceQuery } from "@/rq/asset-audio-source/query";
import { AssetServiceId } from "@/services/assets/types";

import { AssetAudioPlayerControls } from "@/components/containers/asset-audio-player-controls";
import { AssetAudioPlayerTranscript } from "@/components/containers/asset-audio-player-transcript";

export const AssetLayout: React.FC<{
  assetId: string;
  assetType: AssetServiceId;
}> = ({ assetType, assetId }) => {
  const {
    data: asset,
    isLoading: isLoadingAsset,
    isError: isErrorAsset,
  } = useAssetQuery({ assetType, assetId });
  const {
    audioSourceFetchStatus,
    query: {
      data: assetAudioSource,
      isLoading: assetAudioIsLoading,
      isError: assetAudioIsError,
    },
  } = useAssetAudioSourceQuery({
    assetId,
    assetType,
  });

  const audioPlayer = useAudioPlayer(assetAudioSource ?? null);

  return (
    <SafeAreaView style={styles.root}>
      <AssetAudioPlayerTranscript
        audioPlayer={audioPlayer}
        audioSource={assetAudioSource ?? null}
      />
      <AssetAudioPlayerControls audioPlayer={audioPlayer} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
})
