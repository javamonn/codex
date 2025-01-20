import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  Services as AssetServices,
  useAssetServiceContext,
} from "@/components/contexts/AssetsServiceContext";
import { Text } from "@/components/primitives";
import { log } from "@/services/logger";
import { AudioSource } from "expo-audio";

const LOGGER_SERVICE_NAME = "app/asset/[id]";

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

type PlaybackSourceState =
  | { status: "initial" }
  | { status: "downloading"; progress: number }
  | { status: "processing"; progress: number }
  | { status: "ready"; source: AudioSource };

export default function AssetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { services: assetServices } = useAssetServiceContext();
  const { data } = useQuery(getQueryOptions({ assetServices, assetId: id }));
  const [playbackSource, setPlaybackSource] = useState<PlaybackSourceState>({
    status: "initial",
  });

  useEffect(() => {
    if (data && playbackSource.status === "initial") {
      setPlaybackSource({ status: "downloading", progress: 0 });
      console.log("Downloading playback source");
      data
        .getPlaybackSource({
          onProgress: (ev) => {
            switch (ev.type) {
              case "download-progress":
                setPlaybackSource({
                  status: "downloading",
                  progress: ev.loaded / ev.total,
                });
              case "conversion-progress":
                setPlaybackSource({
                  status: "processing",
                  progress: ev.loaded / ev.total,
                });
                break;
            }
          },
        })
        .then((source) => {
          setPlaybackSource({ status: "ready", source });
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [data?.id]);

  return (
    <Text color="primary" size="md">
      {playbackSource.status === "downloading"
        ? `Downloading... ${Math.floor(playbackSource.progress * 100)}%`
        : playbackSource.status === "ready"
        ? "Ready to play"
        : "Loading..."}
    </Text>
  );
}
