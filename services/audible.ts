import {
  randomUUID,
  getRandomBytesAsync,
  digestStringAsync,
  CryptoDigestAlgorithm,
  CryptoEncoding,
} from "expo-crypto";
import type { WebViewProps } from "react-native-webview";

export enum CountryCode {
  US = "us",
  CA = "ca",
  UK = "uk",
  AU = "au",
  FR = "fr",
  DE = "de",
  JP = "jp",
  IT = "it",
  IN = "in",
  ES = "es",
  BR = "br",
}

const LOCALES: Record<CountryCode, { tld: string; marketPlaceId: string }> = {
  [CountryCode.US]: { tld: "com", marketPlaceId: "AF2M0KC94RCEA" },
  [CountryCode.CA]: { tld: "ca", marketPlaceId: "A2CQZ5RBY40XE" },
  [CountryCode.UK]: { tld: "co.uk", marketPlaceId: "A2I9A3Q2GNFNGQ" },
  [CountryCode.AU]: { tld: "com.au", marketPlaceId: "AN7EY7DTAW63G" },
  [CountryCode.FR]: { tld: "fr", marketPlaceId: "A2728XDNODOQ8T" },
  [CountryCode.DE]: { tld: "de", marketPlaceId: "AN7V1F1VY261K" },
  [CountryCode.JP]: { tld: "co.jp", marketPlaceId: "A1QAP3MOU4173J" },
  [CountryCode.IT]: { tld: "it", marketPlaceId: "A2N7FU2W2BU2ZC" },
  [CountryCode.IN]: { tld: "co.in", marketPlaceId: "AJO3FBRUE6J4S" },
  [CountryCode.ES]: { tld: "es", marketPlaceId: "ALMIKO4SZCSAR" },
  [CountryCode.BR]: { tld: "com.br", marketPlaceId: "A10J1VAYUDTYRN" },
} as const;

// Matches python .encode() behavior
function encodeHex(input: string): string {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) > 127) {
      throw new Error("Invalid character in input");
    }
    output += input.charCodeAt(i).toString(16);
  }
  return output;
}

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  "Accept-Language": "en-US",
  "Accept-Encoding": "gzip",
};
const CLIENT_ID_SUFFIX: string = encodeHex("#A2CZJZGLK2JJVM");

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
    ...DEFAULT_HEADERS,
    Cookie: cookieHeader,
  };
}

async function getCodeVerifier(): Promise<string> {
  const verifierBytes = await getRandomBytesAsync(32);
  return btoa(String.fromCharCode.apply(null, Array.from(verifierBytes)))
    .replace(/\+/g, "-") // Convert '+' to '-'
    .replace(/\//g, "_") // Convert '/' to '_'
    .replace(/=+$/, "");
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
  const { tld, marketPlaceId } = LOCALES[countryCode];
  const clientId = deviceSerial + CLIENT_ID_SUFFIX;
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

export async function getOAuthWebviewSource({
  countryCode,
  deviceSerial,
}: {
  countryCode: CountryCode;
  deviceSerial?: string;
}): Promise<WebViewProps["source"]> {
  const deviceSerialWithDefault =
    deviceSerial ?? encodeHex(randomUUID().replace(/-/g, "").toUpperCase());
  const codeVerifier = await getCodeVerifier();
  const [headers, url] = await Promise.all([
    getOAuthHeaders(),
    getOAuthURL({
      countryCode,
      codeVerifier,
      deviceSerial: deviceSerialWithDefault,
    }),
  ]);

  // TODO: probably need to return codeVerifier, domain, serial here as well
  return {
    uri: url.toString(),
    headers,
  };
}
