import {
  QueryClient,
  queryOptions,
  QueryFunctionContext,
  InfiniteData,
  useQueryClient,
  useQuery as nativeUseQuery,
} from "@tanstack/react-query";

import { getQueryKey as unionAssetsGetQueryKey } from "../union-assets/query";
import { UnionAsset } from "../union-assets/types";
import { getQueryOptions as assetServicesGetQueryOptions } from "../asset-services/query";

import { AssetServiceId, Asset } from "@/services/assets/types";

type QueryKey<T extends AssetServiceId> = ["asset", T, string];

const getQueryKey = <T extends AssetServiceId>({
  assetId,
  assetType,
}: {
  assetId: string;
  assetType: T;
}): QueryKey<T> => ["asset", assetType, assetId];

const getInitialData = <T extends AssetServiceId>({
  queryClient,
  assetId,
  assetType,
}: {
  queryClient: QueryClient;
  assetId: string;
  assetType: T;
}) => ({
  initialData: (): Asset<T> | undefined => {
    const assets = queryClient.getQueryData<InfiniteData<UnionAsset[]>>(
      unionAssetsGetQueryKey()
    );

    if (!assets) {
      return undefined;
    }

    for (const page of assets.pages) {
      for (const asset of page) {
        if (asset.id === assetId && asset.type === assetType) {
          return asset;
        }
      }
    }

    return undefined;
  },
  initialDataUpdatedAt: (): number | undefined =>
    queryClient.getQueryState<InfiniteData<UnionAsset[]>>(
      unionAssetsGetQueryKey()
    )?.dataUpdatedAt,
});

const getQuery =
  (queryClient: QueryClient) =>
  async <T extends AssetServiceId>(
    ctx: QueryFunctionContext<QueryKey<T>>
  ): Promise<Asset<T> | null> => {
    const [_, assetType, assetId] = ctx.queryKey;

    const assetService = await queryClient.ensureQueryData(
      assetServicesGetQueryOptions(assetType)
    );

    if (!assetService) {
      throw new Error(`Asset service not found for asset type ${assetType}`);
    }

    return assetService.getAsset({ id: assetId });
  };

export const getQueryOptions = <T extends AssetServiceId>({
  queryClient,
  assetId,
  assetType,
}: {
  queryClient: QueryClient;
  assetId: string;
  assetType: T;
}) => {
  const { initialData, initialDataUpdatedAt } = getInitialData({
    queryClient,
    assetId,
    assetType,
  });

  return queryOptions({
    queryKey: getQueryKey({ assetId, assetType }),
    queryFn: getQuery(queryClient),
    initialData,
    initialDataUpdatedAt,
    // Do not refetch the asset if we have it from cache in initialData
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const useQuery = <T extends AssetServiceId>({
  assetId,
  assetType,
}: {
  assetId: string;
  assetType: T;
}) => {
  const queryClient = useQueryClient();
  return nativeUseQuery(
    getQueryOptions({
      assetId,
      assetType,
      queryClient,
    })
  );
};
