import { useMemo } from "react";
import {
  InfiniteData,
  QueryClient,
  queryOptions,
  useQuery as nativeUseQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";

import { AssetId, Asset } from "@/services/assets/types";
import { log } from "@/services/logger";
import { AudibleAssetsService } from "@/services/assets/audible";
import { useAssetService } from "@/hooks/use-asset-service";

const LOGGER_SERVICE_NAME = "components/layouts/asset/query";

const getQueryOptions = ({
  audible,
  assetId,
  queryClient,
}: {
  assetId: AssetId;
  audible: InstanceType<typeof AudibleAssetsService> | null;
  queryClient: QueryClient;
}) =>
  queryOptions({
    queryKey: ["asset", assetId],
    retry: false,
    queryFn: async (ctx) => {
      const [_, assetId] = ctx.queryKey;
      try {
        const data = await audible!.getAsset({
          id: assetId as AssetId,
        });

        return data ?? null;
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
    // Do not refetch the asset if we have it from cache in initialData
    staleTime: Infinity,
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["assets"])?.dataUpdatedAt,
    enabled: Boolean(audible),
  });

export const useQuery = (id: AssetId): UseQueryResult<Asset | null, Error> => {
  const { data: audible } = useAssetService("audible");
  const queryClient = useQueryClient();

  const queryOptions = useMemo(
    () =>
      getQueryOptions({ audible: audible ?? null, assetId: id, queryClient }),
    [audible ?? null, id, queryClient]
  );

  return nativeUseQuery(queryOptions);
};
