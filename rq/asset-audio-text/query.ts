import { useEffect } from "react";
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  QueryFunctionContext,
} from "@tanstack/react-query";

import { AssetServiceId } from "@/services/assets/types";
import { WhisperService } from "@/services/whisper";
import { useWhisperServiceContext } from "@/components/contexts/whisper-service-context";
import { getAudioSourceText } from "@/services/transcriber/index";

type QueryKey = ["asset-audio-text", AssetServiceId, string];
type QueryMeta = { audioSource: { uri: string } };
type PageParam = { chunkStartSeconds: number; chunkEndSeconds: number };

const getQueryKey = ({
  assetType,
  assetId,
}: {
  assetType: AssetServiceId;
  assetId: string;
}): QueryKey => ["asset-audio-text", assetType, assetId];

const getQuery =
  (whisper: WhisperService) =>
  async (ctx: QueryFunctionContext<QueryKey>): Promise<string> => {
    const [_, assetType, assetId] = ctx.queryKey;
    const audioSource = (ctx.meta as QueryMeta | undefined)?.audioSource;
    const { chunkStartSeconds, chunkEndSeconds } = (ctx.pageParam ?? {
      chunkStartSeconds: Number.NaN,
      chunkEndSeconds: Number.NaN,
    }) as PageParam;

    if (!audioSource) {
      throw new Error("audioSource is required");
    }

    if (
      !Number.isInteger(chunkStartSeconds) ||
      !Number.isInteger(chunkEndSeconds)
    ) {
      throw new Error("chunkStartSeconds and chunkEndSeconds are required");
    }

    return getAudioSourceText({
      id: `${assetType}:${assetId}`,
      audioSource,
      chunkStartSeconds,
      chunkEndSeconds,
      whisper,
    });
  };

const getQueryOptions = ({
  whisper,
  assetType,
  assetId,
  audioSource,
}: {
  whisper: WhisperService;
  assetId: string;
  assetType: AssetServiceId;
  audioSource: { uri: string };
}) =>
  infiniteQueryOptions({
    queryKey: getQueryKey({ assetType, assetId }),
    queryFn: getQuery(whisper),
    meta: { audioSource },
  });

export const useQuery = ({
  assetType,
  assetId,
  audioSource,
}: {
  assetId: string;
  assetType: AssetServiceId;
  audioSource: { uri: string };
}) => {
  const { whisper } = useWhisperServiceContext();

  useEffect(() => {
    // Ensure whisper is intialized on mount
    whisper.initialize();
  }, []);

  return useInfiniteQuery(getQueryOptions({ whisper }));
};
