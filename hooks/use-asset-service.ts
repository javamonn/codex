import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useMutation,

  useQueryClient,
} from "@tanstack/react-query";

import { assetServiceContextServiceKey } from "@/utils/async-storage-key";
import { log } from "@/services/logger";

// Currently supported asset services
export const SERVICE_IDS = ["audible"] as const;
const LOGGER_SERVICE_NAME = "hooks/use-asset-services";

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
