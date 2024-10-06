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

import { Logger } from "@/services/logger";
import { AudibleAssetsService } from "@/services/assets/AudibleAssetsService";

type Services = {
  audible: InstanceType<typeof AudibleAssetsService> | null;
};
type OnRegisterService<T extends keyof Services> = (
  id: T,
  service: NonNullable<Services[T]>
) => Promise<void>;
type ContextData = {
  services: Services;
  onRegisterService: OnRegisterService<keyof Services>;
  onInitializeServices: () => void;
};

const KEY_PREFIX = "AssetsServiceContext";
const LOGGER = new Logger("AssetsServiceContext");

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
      name: `${KEY_PREFIX}:persist:${id}`,
      gen: async () => {
        await AsyncStorage.setItem(
          `${KEY_PREFIX}:${id}`,
          service.getSerializedParams()
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
      name: `${KEY_PREFIX}:hydrate`,
      gen: async () => {
        const serialized = await AsyncStorage.multiGet(
          serviceIds.map((id) => `${KEY_PREFIX}:${id}`)
        );
        const hydratedServices = serialized.reduce((acc, [key, value]) => {
          if (value) {
            switch (key) {
              case `${KEY_PREFIX}:audible`: {
                try {
                  acc.audible = new AudibleAssetsService(value);

                  LOGGER.info("maybeHydrateServices: hydrated audible");
                } catch (e) {
                  LOGGER.error(`maybeHydrateServices: audible`, e as Error);
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

  useEffect(() => {
    const listeners: { [eventName: string]: any } = {};

    if (audible) {
      // Persist the service state after the oauth token is refreshed
      listeners["oauth_token_refreshed"] = async () => {
        try {
          await handlePersistService("audible", audible);
          LOGGER.info("audible: oauth_token_refreshed");
        } catch (e) {
          LOGGER.error("audible: oauth_token_refreshed", e as Error);
        }
      };
      audible
        .getEmitter()
        .addListener(
          "oauth_token_refreshed",
          listeners["oauth_token_refreshed"]
        );
    }

    return () => {
      if (audible) {
        audible
          .getEmitter()
          .removeListener(
            "oauth_token_refreshed",
            listeners["oauth_token_refreshed"]
          );
      }
    };
  }, [audible]);

  // Registers a new AssetService. This should be called once for each service
  // when first connected.
  const onRegisterService: OnRegisterService<keyof Services> = useCallback(
    async (id, service) => {
      LOGGER.info("onRegisterService", { id });

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

  // Attempt to hydrate services registered in previous app sessions from AsyncStorage. This
  // should be called once early in the app lifecycle.
  const onInitializeServices = useCallback(async () => {
    LOGGER.info("onInitializeServices");

    if (hasInitializedServices.current) {
      LOGGER.warn("onInitializeServices: called more than once");
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
