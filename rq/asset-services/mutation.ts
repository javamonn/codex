import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useMutation as nativeUseMutation,
  QueryClient,
  useQueryClient,
} from "@tanstack/react-query";

import { assetServiceContextServiceKey } from "@/utils/async-storage-key";
import { log } from "@/services/logger";
import { AssetServiceId, AssetServiceInstance } from "@/services/assets/types";

import { getQueryKey } from "./query";

const LOGGER_SERVICE_NAME = "rq/asset-services/mutate";

type MutationVariables<T extends AssetServiceId> = {
  serviceId: T;
  service: AssetServiceInstance<T>;
};

type MutationContext<T extends AssetServiceId> = {
  previousService: AssetServiceInstance<T> | undefined;
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
    let prev: AssetServiceInstance<T> | undefined = undefined;

    queryClient.setQueryData<AssetServiceInstance<T>>(
      getQueryKey(serviceId),
      (current) => {
        prev = current;
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
    if (ctx?.previousService) {
      queryClient.setQueryData<AssetServiceInstance<T>>(
        getQueryKey(serviceId),
        ctx.previousService
      );
    } else {
      queryClient.removeQueries({
        queryKey: getQueryKey(serviceId),
        exact: true,
      });
    }
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
