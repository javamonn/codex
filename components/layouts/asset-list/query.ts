import { useMemo } from "react";

import { useInfiniteQuery, infiniteQueryOptions } from "@tanstack/react-query";

import { AudibleAssetsService } from "@/services/assets/audible";
import { log } from "@/services/logger";
import { useAssetService } from "@/hooks/use-asset-service";

const LOGGER_SERVICE_NAME = "components/layouts/asset-list/query";
export const PAGE_LIMIT = 40;

export const getQueryOptions = ({
  audible,
}: {
  audible: InstanceType<typeof AudibleAssetsService> | null;
}) =>
  infiniteQueryOptions({
    queryKey: ["assets"],
    retry: false,
    queryFn: async (ctx) => {
      try {
        const data = await audible!.getAssets({
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
    enabled: Boolean(audible),
  });

export const useQuery = () => {
  const { data: audible } = useAssetService("audible");

  const queryOptions = useMemo(
    () => getQueryOptions({ audible: audible ?? null }),
    [audible ?? null]
  );

  return useInfiniteQuery(queryOptions);
};
