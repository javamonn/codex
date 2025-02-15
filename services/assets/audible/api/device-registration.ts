import { fetch } from "expo/fetch";

import { log } from "@/services/logger";

import type { CompletedOAuthParams } from "./oauth";
import { TLD, CLIENT_ID_SUFFIX } from "./constants";
import { encodeHex } from "./utils";

const LOGGER_SERVICE_NAME = "audible/api/device-registration";

export type DeviceRegistration = {
  adpToken: string;
  devicePrivateKey: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  websiteCookies: Record<string, string>;
  storeAuthenticationCookie: string;
  deviceInfo: Record<string, string>;
  customerInfo: Record<string, string>;
  tld: TLD;
};

// Complete the user-driven oauth flow by exchanging a completed
// oauth token for a device registration.
export async function register({
  oauthParams: { tld, codeVerifier, deviceSerial, authorizationCode },
  headers,
}: {
  oauthParams: CompletedOAuthParams;
  headers: Record<string, string>;
}): Promise<DeviceRegistration> {
  const body = {
    requested_token_type: [
      "bearer",
      "mac_dms",
      "website_cookies",
      "store_authentication_cookie",
    ],
    cookies: { website_cookies: [], domain: `.amazon.${tld}` },
    registration_data: {
      domain: "Device",
      app_version: "3.56.2",
      device_serial: deviceSerial,
      device_type: "A2CZJZGLK2JJVM",
      device_name:
        "%FIRST_NAME%%FIRST_NAME_POSSESSIVE_STRING%%DUPE_STRATEGY_1ST%Audible for iPhone",
      os_version: "15.0.0",
      software_version: "35602678",
      device_model: "iPhone",
      app_name: "Audible",
    },
    auth_data: {
      client_id: encodeHex(deviceSerial + CLIENT_ID_SUFFIX),
      authorization_code: authorizationCode,
      code_verifier: codeVerifier,
      code_algorithm: "SHA-256",
      client_domain: "DeviceLegacy",
    },
    requested_extensions: ["device_info", "customer_info"],
  };

  const res = await fetch(`https://api.amazon.${tld}/auth/register`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: headers,
  });

  const resBody = await res.json();

  log({
    level: "debug",
    message: "registerDevice complete",
    data: resBody,
    service: LOGGER_SERVICE_NAME,
  });

  if (!res.ok) {
    throw new Error(
      `Device registration failed: ${res.statusText} ${JSON.stringify(resBody)}`
    );
  }

  const successResponse = resBody.response.success;
  const tokens = successResponse.tokens;
  const adpToken = tokens.mac_dms.adp_token;
  const devicePrivateKey = tokens.mac_dms.device_private_key;
  const storeAuthenticationCookie = tokens.store_authentication_cookie;
  const accessToken = tokens.bearer.access_token;
  const refreshToken = tokens.bearer.refresh_token;
  const expires_in_seconds = parseInt(tokens.bearer.expires_in);
  const expiresAt = Date.now() + expires_in_seconds * 1000;

  const extensions = successResponse.extensions;
  const deviceInfo = extensions.device_info;
  const customerInfo = extensions.customer_info;

  const websiteCookies = tokens.website_cookies.reduce(
    (acc: Record<string, string>, cookie: { Name: string; Value: string }) => ({
      ...acc,
      [cookie.Name]: cookie.Value.replaceAll('"', ""),
    }),
    {}
  );

  return {
    adpToken,
    devicePrivateKey,
    accessToken,
    refreshToken,
    expiresAt,
    websiteCookies,
    storeAuthenticationCookie,
    deviceInfo,
    customerInfo,
    tld,
  };
}
