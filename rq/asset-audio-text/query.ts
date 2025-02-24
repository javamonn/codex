import { useEffect } from "react";
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  QueryFunctionContext,
  GetNextPageParamFunction,
  GetPreviousPageParamFunction,
} from "@tanstack/react-query";
import { TranscribeResult } from "whisper.rn";

import { AssetServiceId } from "@/services/assets/types";
import { WhisperService } from "@/services/whisper";
import { useWhisperServiceContext } from "@/components/contexts/whisper-service-context";
import { getAudioSourceTextSegments } from "@/services/transcriber";
import { ProgressEvent } from "@/services/assets/progress-event";
import { log } from "@/services/logger";

type QueryKey = ["asset-audio-text", AssetServiceId, string];
type QueryMeta = {
  audioSource: { uri: string };
  onProgress: (ev: {
    ev: ProgressEvent;
    queryKey: QueryKey;
    pageParam: PageParam;
  }) => void;
};
type PageParam = { chunkStartSeconds: number; chunkEndSeconds: number };

const LOGGER_SERVICE_NAME = "rq/asset-audio-text";

const getQueryKey = ({
  assetType,
  assetId,
}: {
  assetType: AssetServiceId;
  assetId: string;
}): QueryKey => ["asset-audio-text", assetType, assetId];

const getQuery =
  (whisper: WhisperService) =>
  async (
    ctx: QueryFunctionContext<QueryKey, PageParam>
  ): Promise<TranscribeResult["segments"]> => {
    const [_, assetType, assetId] = ctx.queryKey;
    const audioSource = (ctx.meta as QueryMeta | undefined)?.audioSource;
    const onProgress = (ctx.meta as QueryMeta | undefined)?.onProgress;

    if (!audioSource) {
      throw new Error("audioSource is required");
    }

    if (!onProgress) {
      throw new Error("onProgress is required");
    }

    return getAudioSourceTextSegments({
      id: `${assetType}:${assetId}`,
      audioSource,
      chunkStartSeconds: ctx.pageParam.chunkStartSeconds,
      chunkEndSeconds: ctx.pageParam.chunkEndSeconds,
      whisper,
      abortSignal: ctx.signal,
      onProgress: (ev) =>
        onProgress({
          ev,
          queryKey: ctx.queryKey,
          pageParam: ctx.pageParam as PageParam,
        }),
    });
  };

const handleProgress = ({
  ev,
  queryKey,
  pageParam,
}: {
  ev: ProgressEvent;
  queryKey: QueryKey;
  pageParam: PageParam;
}) => {
  log({
    service: LOGGER_SERVICE_NAME,
    level: "info",
    data: {
      progressType: ev.type,
      progress:
        Number.isInteger(ev.loaded) && Number.isInteger(ev.total)
          ? ev.loaded! / ev.total!
          : undefined,
      queryKey: queryKey,
      pageParam,
    },
    message: "progress",
  });
};

const handleGetNextPageParam =
  (
    totalDuration: number
  ): GetNextPageParamFunction<PageParam, TranscribeResult["segments"]> =>
  (_lastPage, _allPages, lastPageParam) => {
    // Have transcribed to the end of the audio source
    if (lastPageParam.chunkEndSeconds >= totalDuration) {
      return undefined;
    }

    return {
      chunkStartSeconds: lastPageParam.chunkEndSeconds,
      chunkEndSeconds: Math.min(
        lastPageParam.chunkStartSeconds +
          (lastPageParam.chunkEndSeconds - lastPageParam.chunkStartSeconds),
        totalDuration
      ),
    };
  };

const handleGetPreviousPageParam: GetPreviousPageParamFunction<
  PageParam,
  TranscribeResult["segments"]
> = (_firstPage, _allPages, firstPageParam) => {
  // Have transcribed to the beginning of the audio source
  if (firstPageParam.chunkStartSeconds <= 0) {
    return undefined;
  }

  return {
    chunkStartSeconds: Math.max(
      firstPageParam.chunkStartSeconds -
        (firstPageParam.chunkEndSeconds - firstPageParam.chunkStartSeconds),
      0
    ),
    chunkEndSeconds: firstPageParam.chunkStartSeconds,
  };
};

// TODO: should be able to sync read transcribed cache file from disk in initialData
const getQueryOptions = ({
  whisper,
  assetType,
  assetId,
  audioSource,
  audioSourceDuration,
  initialPageParam,
}: {
  whisper: WhisperService;
  assetId: string;
  assetType: AssetServiceId;
  audioSource: { uri: string };
  audioSourceDuration: number;
  initialPageParam: PageParam;
}) =>
  infiniteQueryOptions({
    queryKey: getQueryKey({ assetType, assetId }),
    queryFn: getQuery(whisper),
    initialPageParam: initialPageParam,
    getNextPageParam: handleGetNextPageParam(audioSourceDuration),
    getPreviousPageParam: handleGetPreviousPageParam,
    meta: { audioSource, onProgress: handleProgress } as QueryMeta,
  });

export const useQuery = ({
  assetType,
  assetId,
  audioSource,
  audioSourceDuration,
  initialPageParam,
}: {
  assetId: string;
  assetType: AssetServiceId;
  audioSource: { uri: string };
  audioSourceDuration: number;
  initialPageParam: PageParam;
}) => {
  const { whisper } = useWhisperServiceContext();

  useEffect(() => {
    // Ensure whisper is intialized on mount
    whisper.initialize();
  }, []);

  return useInfiniteQuery(
    getQueryOptions({
      whisper,
      assetType,
      assetId,
      audioSource,
      audioSourceDuration,
      initialPageParam,
    })
  );
};
