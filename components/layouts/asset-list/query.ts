import { useMemo } from "react";

import { useInfiniteQuery, infiniteQueryOptions } from "@tanstack/react-query";

import {
  useAssetServiceContext,
  Services as AssetServices,
} from "@/components/contexts/AssetsServiceContext";
import { log } from "@/services/logger";

const LOGGER_SERVICE_NAME = "components/layouts/asset-list/query"
export const PAGE_LIMIT = 40;

export const getQueryOptions = ({
  assetServices,
  isInitialized,
}: {
  assetServices: AssetServices;
  isInitialized: boolean;
}) =>
  infiniteQueryOptions({
    queryKey: ["assets"],
    retry: false,
    queryFn: async (ctx) => {
      try {
        const data = await assetServices.audible?.getAssets({
          page: ctx.pageParam,
          limit: PAGE_LIMIT,
        });

        return data ?? [];
      } catch (err) {
        log({
          service: LOGGER_SERVICE_NAME,
          message: "Failed to fetch assets",
          data: { error: err, page: ctx.pageParam },
          level: "error",
        });
        throw err;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage?.length === PAGE_LIMIT ? pages.length : undefined,
    select: (data) => data.pages.flatMap((page) => page),
    enabled: isInitialized && Boolean(assetServices.audible),
  });

export const useQuery = () => {
  const { services: assetServices, isInitialized } = useAssetServiceContext();

  const queryOptions = useMemo(
    () => getQueryOptions({ assetServices, isInitialized }),
    [assetServices]
  );

  return useInfiniteQuery(queryOptions);
};
