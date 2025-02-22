import {
  GetNextPageParamFunction,
  infiniteQueryOptions,
  QueryFunctionContext,
  InfiniteData,
  useInfiniteQuery as nativeUseInfiniteQuery,
} from "@tanstack/react-query";

import { useQuery as useAssetService } from "../asset-services/query";

import type { UnionAssetService, UnionAsset } from "./types";

export const PAGE_LIMIT = 40;

type QueryKey = ["union-assets"];

export const getQueryKey = (): QueryKey => ["union-assets"];

const getQuery =
  (unionAssetService: UnionAssetService) =>
  (ctx: QueryFunctionContext<QueryKey, number>) => {
    return unionAssetService.getAssets({
      page: ctx.pageParam,
      limit: 40,
    });
  };

const handleGetNextPageParam: GetNextPageParamFunction<number, UnionAsset[]> = (
  lastPage,
  pages
) => (lastPage?.length === PAGE_LIMIT ? pages.length : undefined);

const handleSelect = (data: InfiniteData<UnionAsset[]>) =>
  data.pages.flatMap((page) => page);

const getQueryOptions = (unionAssetService: UnionAssetService | null) =>
  infiniteQueryOptions({
    queryKey: getQueryKey(),
    queryFn: unionAssetService ? getQuery(unionAssetService) : undefined,
    retry: false,
    initialPageParam: 1,
    getNextPageParam: handleGetNextPageParam,
    select: handleSelect,
    enabled: Boolean(unionAssetService),
  });

export const useQuery = () => {
  // FIXME: should use a specific union asset service backed by sqlite instead
  const { data: assetService } = useAssetService("audible");

  return nativeUseInfiniteQuery(getQueryOptions(assetService ?? null));
};
