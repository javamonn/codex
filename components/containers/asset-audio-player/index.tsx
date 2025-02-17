import { useState, useEffect } from "react";

import type { Asset } from "@/services/assets/types";

import { AudioSourceState } from "./types";
import { AudioPlayerLoading } from "./audio-player-loading";
import { AudioPlayer } from "./audio-player";

export const AssetAudioPlayer: React.FC<{ asset: Asset }> = ({ asset }) => {
  const [audioSource, setAudioSource] = useState<AudioSourceState>({
    status: "initial",
  });

  useEffect(() => {
    if (!asset || audioSource.status !== "initial") {
      // No data or already initialized
      return;
    }

    setAudioSource({ status: "downloading", progress: 0 });
    asset
      .getPlaybackSource({
        onProgress: (ev) => {
          switch (ev.type) {
            case "download-progress":
              setAudioSource({
                status: "downloading",
                progress: ev.loaded / ev.total,
              });
            case "conversion-progress":
              setAudioSource({
                status: "processing",
                progress: ev.loaded / ev.total,
              });
              break;
          }
        },
      })
      .then((source) => {
        setAudioSource({ status: "ready", source });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [asset?.id]);

  switch (audioSource.status) {
    case "ready": {
      return <AudioPlayer source={audioSource.source} />;
    }
    default: {
      return <AudioPlayerLoading />;
    }
  }
};
