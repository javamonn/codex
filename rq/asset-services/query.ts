import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QueryFunctionContext,
  queryOptions,
  useQuery as nativeUseQuery,
} from "@tanstack/react-query";

import { assetServiceContextServiceKey } from "@/utils/async-storage-key";
import { AudibleAssetService } from "@/services/assets/audible";
import { AssetServiceId, AssetServiceInstance } from "@/services/assets/types";

type QueryKey<T extends AssetServiceId> = ["asset-services", T];

export const getQueryKey = <T extends AssetServiceId>(
  serviceId: T
): QueryKey<T> => ["asset-services", serviceId];

const handleQuery = async <T extends AssetServiceId>(
  ctx: QueryFunctionContext<QueryKey<T>>
): Promise<AssetServiceInstance<T> | null> => {
  const [_, serviceId] = ctx.queryKey;

  const serialized = await AsyncStorage.getItem(
    assetServiceContextServiceKey(serviceId)
  );

  if (!serialized) {
    return null;
  }

  switch (serviceId) {
    case "audible": {
      return new AudibleAssetService(serialized) as AssetServiceInstance<T>;
    }
    default:
      throw new Error(`Unknown serviceId: ${serviceId}`);
  }
};

export const getQueryOptions = <T extends AssetServiceId>(serviceId: T) =>
  queryOptions({
    queryKey: getQueryKey(serviceId),
    queryFn: handleQuery,
    retry: false,
    // Asset services are persisted in memory indefinitely
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const useQuery = <T extends AssetServiceId>(serviceId: T) => {
  return nativeUseQuery(getQueryOptions(serviceId));
};
