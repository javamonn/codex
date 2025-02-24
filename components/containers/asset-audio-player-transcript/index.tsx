import { AssetServiceId } from "@/services/assets/types";
import { AudioPlayer, AudioSource } from "expo-audio";

export const AssetAudioPlayerTranscript: React.FC<{
  assetId: string;
  assetType: AssetServiceId;
  audioPlayer: AudioPlayer;
  audioSource: AudioSource;
}> = ({ audioPlayer, audioSource, assetId, assetType }) => {
  return null;
};
