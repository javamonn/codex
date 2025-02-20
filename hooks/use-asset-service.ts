import { useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { AudibleAssetsService } from "@/services/assets/audible";
import { assetServiceContextServiceKey } from "@/utils/async-storage-key";
import { log } from "@/services/logger";

export type Services = {
  audible: InstanceType<typeof AudibleAssetsService> | null;
};
type ServiceId = keyof Services;

// Currently supported asset services
export const SERVICE_IDS = ["audible"] as const;
const LOGGER_SERVICE_NAME = "hooks/use-asset-services";

const getQueryOptions = <T extends ServiceId>(serviceId: T) =>
  queryOptions({
    queryKey: ["asset-services", serviceId],
    queryFn: async () => {
      const serialized = await AsyncStorage.getItem(
        assetServiceContextServiceKey(serviceId)
      );

      if (!serialized) {
        return null;
      }

      switch (serviceId) {
        case "audible": {
          return new AudibleAssetsService(serialized);
        }
        default:
          throw new Error(`Unknown serviceId: ${serviceId}`);
      }
    },

    // Asset services are persisted in memory indefinitely
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const useAssetService = <T extends ServiceId>(serviceId: T) => {
  const queryOptions = useMemo(() => getQueryOptions(serviceId), [serviceId]);

  return useQuery(queryOptions);
};

export const useMutateAssetService = <T extends ServiceId>(serviceId: T) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (service: NonNullable<Services[T]>) => {
      return AsyncStorage.setItem(
        assetServiceContextServiceKey(serviceId),
        JSON.stringify(service)
      );
    },
    onMutate: (service) => {
      let prev: Services[T] | null = null;

      queryClient.setQueryData<Services[T]>(
        ["asset-services", serviceId],
        (current) => {
          prev = current ?? null;
          return service;
        }
      );

      return prev;
    },
    onSuccess: () => {
      log({
        service: LOGGER_SERVICE_NAME,
        message: "Successfully mutated asset service",
        data: { serviceId },
        level: "info",
      });
    },
    onError: (err, _variables, context) => {
      log({
        service: LOGGER_SERVICE_NAME,
        message: "Failed to mutate asset service",
        data: { error: err, serviceId },
        level: "error",
      });

      // Rollback value set in `onMutate` on error
      queryClient.setQueryData<Services[T]>(
        ["asset-services", serviceId],
        context ?? null
      );
    },
  });
};
