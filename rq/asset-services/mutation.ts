import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useMutation as nativeUseMutation,
  QueryClient,
  useQueryClient,
} from "@tanstack/react-query";

import { assetServiceContextServiceKey } from "@/utils/async-storage-key";
import { log } from "@/services/logger";

import { getQueryKey } from "./query";
import { AssetServices, AssetServiceId } from "./types";

const LOGGER_SERVICE_NAME = "rq/asset-services/mutate";

type MutationVariables<T extends AssetServiceId> = {
  serviceId: T;
  service: AssetServices[T];
};

type MutationContext<T extends AssetServiceId> = {
  previousService: AssetServices[T];
};

const handleMutation = async <T extends AssetServiceId>({
  serviceId,
  service,
}: MutationVariables<T>): Promise<void> => {
  await AsyncStorage.setItem(
    assetServiceContextServiceKey(serviceId),
    JSON.stringify(service)
  );
};

const handleSuccess = <T extends AssetServiceId>(
  _data: void,
  { serviceId }: MutationVariables<T>,
  _ctx: MutationContext<T>
): void => {
  log({
    service: LOGGER_SERVICE_NAME,
    message: "Successfully mutated asset service",
    data: { serviceId },
    level: "info",
  });
};

const getOnMutate =
  (queryClient: QueryClient) =>
  <T extends AssetServiceId>({
    service,
    serviceId,
  }: MutationVariables<T>): MutationContext<T> => {
    let prev: AssetServices[T] | null = null;

    queryClient.setQueryData<AssetServices[T]>(
      getQueryKey(serviceId),
      (current) => {
        prev = current ?? null;
        return service;
      }
    );

    return { previousService: prev };
  };

const getOnError =
  (queryClient: QueryClient) =>
  <T extends AssetServiceId>(
    err: Error,
    { serviceId }: MutationVariables<T>,
    ctx: MutationContext<T> | undefined
  ): void => {
    log({
      service: LOGGER_SERVICE_NAME,
      message: "Failed to mutate asset service",
      data: { error: err, serviceId },
      level: "error",
    });

    // Rollback value set in `onMutate` on error
    queryClient.setQueryData<AssetServices[T]>(
      ["assets-services", serviceId],
      ctx?.previousService ?? null
    );
  };

export const useMutation = <T extends AssetServiceId>() => {
  const queryClient = useQueryClient();

  return nativeUseMutation<
    void,
    Error,
    MutationVariables<T>,
    MutationContext<T>
  >({
    mutationFn: handleMutation,
    onMutate: getOnMutate(queryClient),
    onError: getOnError(queryClient),
    onSuccess: handleSuccess,
  });
};
