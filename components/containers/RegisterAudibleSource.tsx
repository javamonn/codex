import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView, WebViewProps } from "react-native-webview";
import { useState, useEffect, useCallback } from "react";

import { useRegisterService } from "@/components/contexts/AssetsServiceContext";
import { Logger } from "@/services/logger";
import { AudibleAssetsService } from "@/services/assets/AudibleAssetsService";
import {
  CountryCode,
  OAuthParams,
  getOAuthWebviewSource,
  registerDevice,
} from "@/services/audible";

type FlowState =
  | {
      // initial state, pending async webview source fetch
      state: "oauth_init";
    }
  | {
      // waiting for user to complete oauth via webview
      state: "oauth_pending";
      source: { uri: string; headers: Record<string, string> };
      oauthParams: Omit<OAuthParams, "authorizationCode">;
    }
  | {
      // user oauth complete, token available
      state: "oauth_complete";
      oauthParams: OAuthParams;
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

const LOGGER = new Logger("ConnectAudible");

export default function RegisterAudibleSource() {
  const [flowState, setFlowState] = useState<FlowState>({
    state: "oauth_init",
  });
  const registerService = useRegisterService();

  // flowState oauth_init -> oauth_pending
  const handleOAuthInit = useCallback(async () => {
    const { source, oauthParams } = await getOAuthWebviewSource({
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
    async (oauthParams: OAuthParams, headers: Record<string, string>) => {
      LOGGER.info("oauth complete");
      try {
        const { deviceRegistration, oauthToken } = await registerDevice(
          oauthParams,
          headers
        );

        const audibleService = new AudibleAssetsService({
          deviceRegistration,
          oauthToken,
          tld: oauthParams.tld,
        });

        await registerService("audible", audibleService);
      } catch (e) {
        LOGGER.error("device registration error", e as Error);
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

        console.log(
          "handleWebviewNavigationStateChange",
          url.pathname,
          url.search
        );

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
