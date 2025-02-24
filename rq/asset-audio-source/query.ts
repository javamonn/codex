import {
  QueryClient,
  useQueryClient,
  queryOptions,
  QueryFunctionContext,
  useQuery as useNativeQuery,
} from "@tanstack/react-query";
import type { AudioSource } from "expo-audio";

import { AssetServiceId } from "@/services/assets/types";
import { ProgressEventHandler } from "@/services/assets/progress-event";

import { getQueryOptions as assetServicesGetQueryOptions } from "../asset-services/query";
import { getQueryOptions as assetGetQueryOptions } from "../asset/query";

import { useAudioSourceFetchStatus } from "./audio-source-fetch-status";

type QueryKey = ["asset-audio-source", AssetServiceId, string];

const getQueryKey = ({
  assetId,
  assetType,
}: {
  assetId: string;
  assetType: AssetServiceId;
}): QueryKey => ["asset-audio-source", assetType, assetId];

const getQuery =
  (queryClient: QueryClient) =>
  async (ctx: QueryFunctionContext<QueryKey>): Promise<AudioSource | null> => {
    const [_, assetType, assetId] = ctx.queryKey;

    if (!ctx.meta?.onProgress) {
      throw new Error("onProgress is required");
    }

    const [asset, assetService] = await Promise.all([
      queryClient.ensureQueryData(
        assetGetQueryOptions({ assetId, assetType, queryClient })
      ),
      queryClient.ensureQueryData(assetServicesGetQueryOptions(assetType)),
    ]);

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    if (!assetService) {
      throw new Error(`Asset service not found: ${assetType}`);
    }

    return assetService.getAssetAudioSource({
      asset,
      abortSignal: ctx.signal,
      onProgress: ctx.meta.onProgress as ProgressEventHandler,
    });
  };

const getQueryOptions = ({
  assetId,
  assetType,
  queryClient,
  onProgress,
}: {
  queryClient: QueryClient;
  assetId: string;
  assetType: AssetServiceId;
  onProgress: ProgressEventHandler;
}) => {
  return queryOptions({
    queryKey: getQueryKey({ assetId, assetType }),
    queryFn: getQuery(queryClient),
    meta: { onProgress: onProgress },
    staleTime: Infinity,
    gcTime: 5 * 6 * 1000,
  });
};

export const useQuery = ({
  assetId,
  assetType,
}: {
  assetId: string;
  assetType: AssetServiceId;
}) => {
  const queryClient = useQueryClient();
  const { audioSourceFetchStatus, onProgress } = useAudioSourceFetchStatus();
  const query = useNativeQuery(
    getQueryOptions({
      assetId,
      assetType,
      queryClient,
      onProgress,
    })
  );

  return { query, audioSourceFetchStatus };
};
