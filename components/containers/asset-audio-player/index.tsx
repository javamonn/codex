import { useState, useEffect } from "react";
import {
  InfiniteData,
  QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Services as AssetServices,
  useAssetServiceContext,
} from "@/components/contexts/AssetsServiceContext";
import { Asset } from "@/services/assets/types";
import { log } from "@/services/logger";

import { AudioSourceState } from "./types";
import { AudioPlayerLoading } from "./audio-player-loading";
import { AudioPlayer } from "./audio-player";

const LOGGER_SERVICE_NAME = "components/containers/Asset";

// FIXME: likely don't need to refetch here if it exists
const getQueryOptions = ({
  assetServices,
  assetId,
  queryClient,
}: {
  assetId: string;
  assetServices: AssetServices;
  queryClient: QueryClient;
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
    initialData: () => {
      const assets = queryClient.getQueryData<InfiniteData<Asset[]>>([
        "assets",
      ]);

      if (!assets) {
        return undefined;
      }

      for (const page of assets.pages) {
        for (const asset of page) {
          if (asset.id === assetId) {
            return asset;
          }
        }
      }

      return undefined;
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["assets"])?.dataUpdatedAt,
  });

export const AssetAudioPlayer: React.FC<{ assetId: string }> = ({
  assetId,
}) => {
  const { services: assetServices } = useAssetServiceContext();
  const queryClient = useQueryClient();
  console.log("queryClient", queryClient);
  const { data: asset } = useQuery(
    getQueryOptions({ assetServices, assetId, queryClient })
  );
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
