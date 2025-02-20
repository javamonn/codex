import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView, WebViewProps } from "react-native-webview";
import { useState, useEffect, useCallback } from "react";

import { useMutateAssetService } from "@/hooks/use-asset-service";
import { log } from "@/services/logger";
import { AudibleAssetsService } from "@/services/assets/audible";
import {
  InitialOAuthParams,
  CompletedOAuthParams,
  getInitialOAuthParams,
} from "@/services/assets/audible/api/oauth";
import { register } from "@/services/assets/audible/api/device-registration";
import { CountryCode } from "@/services/assets/audible/api/constants";

type FlowState =
  | {
      // initial state, pending async webview source fetch
      state: "oauth_init";
    }
  | {
      // waiting for user to complete oauth via webview
      state: "oauth_pending";
      source: { uri: string; headers: Record<string, string> };
      oauthParams: InitialOAuthParams;
    }
  | {
      // user oauth complete, token available
      state: "oauth_complete";
      oauthParams: CompletedOAuthParams;
      oauthHeaders: Record<string, string>;
    }
  | {
      // error during oauth flow
      state: "oauth_error";
      error: Error;
    }
  | {
      // waiting for device registration via audible api
      state: "device_registration_pending";
    }
  | { state: "device_registration_error"; error: Error } // error during device registration
  | { state: "unknown_error"; error: Error }; // unknown error

function FlowLoader() {
  return (
    <View style={styles.flowLoaderContainer}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const LOGGER_SERVICE_NAME = "containers/RegisterAudibleSource";

export default function RegisterAudibleSource() {
  const [flowState, setFlowState] = useState<FlowState>({
    state: "oauth_init",
  });

  const { mutate: onMutateAudibleService } = useMutateAssetService("audible");

  // flowState oauth_init -> oauth_pending
  const handleOAuthInit = useCallback(async () => {
    const { source, oauthParams } = await getInitialOAuthParams({
      countryCode: CountryCode.US,
    });

    console.log("handleOAuthInit > getOAuthWebview source", {
      source,
      oauthParams,
    });

    setFlowState({
      state: "oauth_pending",
      source,
      oauthParams,
    });
  }, [setFlowState]);

  // flowState oauth_complete -> device_registration_pending
  const handleOAuthComplete = useCallback(
    async (
      oauthParams: CompletedOAuthParams,
      headers: Record<string, string>
    ) => {
      log({
        level: "info",
        message: "oauth complete",
        service: LOGGER_SERVICE_NAME,
      });

      try {
        const deviceRegistration = await register({
          oauthParams,
          headers,
        });

        const audibleService = new AudibleAssetsService({ deviceRegistration });

        return new Promise((resolve, reject) => {
          onMutateAudibleService(audibleService, {
            onError: (err) => {
              reject(err);
            },
            onSuccess: () => {
              resolve(void 0);
            },
          });
        });
      } catch (e) {
        log({
          level: "error",
          message: "device registration error",
          data: e as Error,
          service: LOGGER_SERVICE_NAME,
        });
        setFlowState({
          state: "device_registration_error",
          error: e as Error,
        });
      }
    },
    [setFlowState]
  );

  const handleWebviewNavigationStateChange: NonNullable<
    WebViewProps["onNavigationStateChange"]
  > = useCallback(
    (event) => {
      try {
        const url = new URL(event.url);

        if (url.pathname === "/ap/maplanding") {
          if (!url.searchParams.has("openid.oa2.authorization_code")) {
            setFlowState({
              state: "oauth_error",
              error: new Error(
                `Missing authorization code in url: ${url.toString()}`
              ),
            });
          }

          const authorizationCode = url.searchParams.get(
            "openid.oa2.authorization_code"
          ) as string;

          setFlowState((prev) => {
            if (prev.state !== "oauth_pending") {
              return {
                state: "unknown_error",
                error: new Error(
                  `Invalid state: expected oauth_pending, got ${prev.state}.`
                ),
              };
            }

            return {
              state: "oauth_complete",
              oauthParams: {
                ...prev.oauthParams,
                authorizationCode,
              },
              oauthHeaders: prev.source.headers,
            };
          });
        }
      } catch (error) {
        setFlowState({
          state: "unknown_error",
          error: error as Error,
        });
      }
    },
    [setFlowState]
  );

  useEffect(() => {
    switch (flowState.state) {
      case "oauth_init":
        handleOAuthInit();
        break;
      case "oauth_complete":
        handleOAuthComplete(flowState.oauthParams, flowState.oauthHeaders);
        break;
    }
  }, [flowState]);

  switch (flowState.state) {
    case "oauth_init":
      return <FlowLoader />;
    case "oauth_pending":
      return (
        <WebView
          source={flowState.source}
          style={styles.webview}
          onNavigationStateChange={handleWebviewNavigationStateChange}
          userAgent={flowState.source.headers["User-Agent"]}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  flowLoaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
