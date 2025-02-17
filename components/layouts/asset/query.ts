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
import {
  Services as AssetServices,
  useAssetServiceContext,
} from "@/components/contexts/AssetsServiceContext";
import { log } from "@/services/logger";

const LOGGER_SERVICE_NAME = "components/layouts/asset/query";

const getQueryOptions = ({
  assetServices,
  assetId,
  queryClient,
}: {
  assetId: AssetId;
  assetServices: AssetServices;
  queryClient: QueryClient;
}) =>
  queryOptions({
    queryKey: ["asset", assetId],
    retry: false,
    queryFn: async (ctx) => {
      const [_, assetId] = ctx.queryKey;
      try {
        const data = await assetServices.audible?.getAsset({
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
  });

export const useQuery = (id: AssetId): UseQueryResult<Asset | null, Error> => {
  const { services: assetServices } = useAssetServiceContext();
  const queryClient = useQueryClient();

  const queryOptions = useMemo(
    () => getQueryOptions({ assetServices, assetId: id, queryClient }),
    [assetServices, id, queryClient]
  );

  return nativeUseQuery(queryOptions);
};
