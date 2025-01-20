import {
  createContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { InteractionManager } from "react-native";

import { log } from "@/services/logger";
import { AudibleAssetsService } from "@/services/assets/audible";
import { assetServiceContextServiceKey } from "@/utils/cache-key";

export type Services = {
  audible: InstanceType<typeof AudibleAssetsService> | null;
};

const AUDIBLE_SERVICE_KEY = assetServiceContextServiceKey("audible");

type OnRegisterService<T extends keyof Services> = (
  id: T,
  service: NonNullable<Services[T]>
) => Promise<void>;
type ContextData = {
  services: Services;
  onRegisterService: OnRegisterService<keyof Services>;
  onInitializeServices: () => void;
};

const LOGGER_SERVICE_NAME = "AssetsServiceContext";

const Context = createContext<ContextData>({
  services: {
    audible: null,
  },
  onRegisterService: (_id, _service) => {
    throw new Error("registerService not implemented");
  },
  onInitializeServices: () => {
    throw new Error("initializeServices not implemented");
  },
});

function handlePersistService<T extends keyof Services>(
  id: T,
  service: NonNullable<Services[T]>
): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions({
      name: `handlePersistService:${id}`,
      gen: async () => {
        await AsyncStorage.setItem(
          assetServiceContextServiceKey(id),
          JSON.stringify(service)
        );

        resolve();
      },
    });
  });
}

function maybeHydrateServices<T extends keyof Services>(
  serviceIds: T[]
): Promise<Partial<Services>> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions({
      name: `maybeHydrateServices:hydrate`,
      gen: async () => {
        const serialized = await AsyncStorage.multiGet(
          serviceIds.map((id) => assetServiceContextServiceKey(id))
        );
        const hydratedServices = serialized.reduce((acc, [key, value]) => {
          if (value) {
            switch (key) {
              case AUDIBLE_SERVICE_KEY: {
                try {
                  acc.audible = new AudibleAssetsService(value);

                  log({
                    level: "info",
                    message: "maybeHydrateServices: hydrated audible",
                    service: LOGGER_SERVICE_NAME,
                  });
                } catch (e) {
                  log({
                    level: "error",
                    message: `maybeHydrateServices: audible`,
                    data: { error: e },
                    service: LOGGER_SERVICE_NAME,
                  });
                }

                break;
              }
              default:
                return acc;
            }
          }

          return acc;
        }, {} as Partial<Services>);

        resolve(hydratedServices as Services);
      },
    });
  });
}

export const AssetServiceContextProvider = ({
  children,
  onInitialized,
  initializeOnMount,
}: {
  children: React.ReactNode;
  onInitialized: () => void;
  initializeOnMount: boolean;
}) => {
  const [audible, setAudible] = useState<InstanceType<
    typeof AudibleAssetsService
  > | null>(null);
  const hasInitializedServices = useRef(false);

  // Registers a new AssetService. This should be called once for each
  // service when first connected.
  const onRegisterService: OnRegisterService<keyof Services> = useCallback(
    async (id, service) => {
      log({
        level: "info",
        message: "onRegisterService",
        data: { id },
        service: LOGGER_SERVICE_NAME,
      });

      // Update service state
      switch (id) {
        case "audible":
          setAudible(service as InstanceType<typeof AudibleAssetsService>);
          break;
        default:
          throw new Error(`Unknown service id: ${id}`);
      }

      // Persist service state
      await handlePersistService(id, service);
    },
    [setAudible]
  );

  // Attempt to hydrate services registered in previous app sessions
  // from AsyncStorage. This should be called once early in the app
  // lifecycle.
  const onInitializeServices = useCallback(async () => {
    log({
      level: "info",
      message: "onInitializeServices",
      service: LOGGER_SERVICE_NAME,
    });

    if (hasInitializedServices.current) {
      log({
        level: "warn",
        message: "onInitializeServices: called more than once",
        service: LOGGER_SERVICE_NAME,
      });
      return;
    }
    const hydratedServices = await maybeHydrateServices(["audible"]);

    if (hydratedServices.audible) {
      setAudible(hydratedServices.audible);
    }

    hasInitializedServices.current = true;
    onInitialized();
  }, [setAudible, onInitialized]);

  useEffect(() => {
    if (initializeOnMount) {
      onInitializeServices();
    }
  }, []);

  const contextData: ContextData = useMemo(() => {
    return {
      services: {
        audible,
      },
      onRegisterService,
      onInitializeServices,
    };
  }, [audible, onRegisterService, onInitializeServices]);

  return <Context.Provider value={contextData}>{children}</Context.Provider>;
};

// Hooks

export const useAssetServiceContext = () => {
  return useContext(Context);
};

export const useRegisterService = () => {
  const { onRegisterService } = useAssetServiceContext();
  return onRegisterService;
};

export const useIsServiceRegistered = (id: keyof Services) => {
  const { services } = useAssetServiceContext();
  return services[id] !== null;
};
