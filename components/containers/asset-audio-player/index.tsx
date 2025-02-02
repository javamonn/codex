import { useState, useEffect } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  Services as AssetServices,
  useAssetServiceContext,
} from "@/components/contexts/AssetsServiceContext";
import { log } from "@/services/logger";

import { AudioSourceState } from "./types";
import { AudioPlayerLoading } from "./audio-player-loading";
import { AudioPlayer } from "./audio-player";

const LOGGER_SERVICE_NAME = "components/containers/Asset";

const getQueryOptions = ({
  assetServices,
  assetId,
}: {
  assetId: string;
  assetServices: AssetServices;
}) =>
  queryOptions({
    queryKey: ["asset", assetId],
    retry: false,
    queryFn: async (ctx) => {
      const [_, assetId] = ctx.queryKey;
      try {
        const data = await assetServices.audible?.getAsset({ id: assetId });
        return data;
      } catch (err) {
        log({
          service: LOGGER_SERVICE_NAME,
          message: "Failed to fetch asset",
          data: { error: err, assetId },
          level: "error",
        });
        throw err;
      }
    },
  });

export const AssetAudioPlayer: React.FC<{ assetId: string }> = ({ assetId }) => {
  const { services: assetServices } = useAssetServiceContext();
  const { data: asset } = useQuery(getQueryOptions({ assetServices, assetId }));
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
