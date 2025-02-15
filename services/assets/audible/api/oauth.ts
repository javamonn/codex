import {
  randomUUID,
  getRandomBytesAsync,
  digestStringAsync,
  CryptoDigestAlgorithm,
  CryptoEncoding,
} from "expo-crypto";

import {
  TLD,
  CountryCode,
  Locale,
  CLIENT_ID_SUFFIX,
  DEVICE_REGISTRATION_DEFAULT_HEADERS,
} from "./constants";
import { encodeHex } from "./utils";

export type InitialOAuthParams = {
  deviceSerial: string; // A virtual device serial number, used in oauth and device registration
  codeVerifier: string; // A random byte string, used in oauth and device registration
  tld: TLD; // Top-level domain for the marketplace country (e.g. "com")
};

export type CompletedOAuthParams = InitialOAuthParams & {
  authorizationCode: string; // Code received from oauth flow completion, used in device registration
};

// Get the source and oauth params required for starting the
// user driven oauth flow to be completed in a webview.
export async function getInitialOAuthParams({
  countryCode,
  deviceSerial,
}: {
  countryCode: CountryCode;
  deviceSerial?: string;
}): Promise<{
  source: { uri: string; headers: Record<string, string> };
  oauthParams: InitialOAuthParams;
}> {
  const deviceSerialWithDefault =
    deviceSerial ?? randomUUID().replace(/-/g, "").toUpperCase();
  const codeVerifier = await getCodeVerifier();
  const [headers, url] = await Promise.all([
    getOAuthHeaders(),
    getOAuthURL({
      countryCode,
      codeVerifier,
      deviceSerial: deviceSerialWithDefault,
    }),
  ]);

  return {
    source: {
      uri: url.toString(),
      headers,
    },
    oauthParams: {
      tld: Locale[countryCode].tld,
      deviceSerial: deviceSerialWithDefault,
      codeVerifier,
    },
  };
}

async function getOAuthHeaders(): Promise<Record<string, string>> {
  const frcBytes = await getRandomBytesAsync(313);
  const frc = btoa(
    String.fromCharCode.apply(null, Array.from(frcBytes))
  ).replace(/=+$/, "");

  const mapMd = btoa(
    JSON.stringify({
      device_user_dictionary: [],
      device_registration_data: { software_version: "35602678" },
      app_identifier: {
        app_version: "3.56.2",
        bundle_id: "com.audible.iphone",
      },
    })
  ).replace(/=+$/, "");

  const cookieHeader = Object.entries({
    frc,
    "map-md": mapMd,
    "amzn-app-id": "MAPiOSLib/6.0/ToHideRetailLink",
  })
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  return {
    ...DEVICE_REGISTRATION_DEFAULT_HEADERS,
    Cookie: cookieHeader,
  };
}

async function getOAuthURL({
  countryCode,
  codeVerifier,
  deviceSerial,
}: {
  deviceSerial: string;
  countryCode: CountryCode;
  codeVerifier: string;
}): Promise<URL> {
  const { tld, marketPlaceId } = Locale[countryCode];
  const clientId = encodeHex(deviceSerial + CLIENT_ID_SUFFIX);
  const codeChallenge = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: CryptoEncoding.BASE64 }
  ).then((digest) =>
    // safe url encode, strip trailing '='
    digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  );

  const params = new URLSearchParams({
    "openid.oa2.response_type": "code",
    "openid.oa2.code_challenge_method": "S256",
    "openid.oa2.code_challenge": codeChallenge,
    "openid.return_to": `https://www.amazon.${tld}/ap/maplanding`,
    "openid.assoc_handle": `amzn_audible_ios_${countryCode}`,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    pageId: "amzn_audible_ios",
    accountStatusPolicy: "P1",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.mode": "checkid_setup",
    "openid.ns.oa2": "http://www.amazon.com/ap/ext/oauth/2",
    "openid.oa2.client_id": `device:${clientId}`,
    "openid.ns.pape": "http://specs.openid.net/extensions/pape/1.0",
    marketPlaceId: marketPlaceId,
    "openid.oa2.scope": "device_auth_access",
    forceMobileLayout: "true",
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.pape.max_auth_age": "0",
  });

  return new URL(`https://www.amazon.${tld}/ap/signin?${params.toString()}`);
}

async function getCodeVerifier(): Promise<string> {
  const verifierBytes = await getRandomBytesAsync(32);
  return btoa(String.fromCharCode.apply(null, Array.from(verifierBytes)))
    .replace(/\+/g, "-") // Convert '+' to '-'
    .replace(/\//g, "_") // Convert '/' to '_'
    .replace(/=+$/, "");
}
