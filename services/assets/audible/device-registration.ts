import {
  randomUUID,
  getRandomBytesAsync,
  digestStringAsync,
  CryptoDigestAlgorithm,
  CryptoEncoding,
} from "expo-crypto";
import JSEncrypt from "jsencrypt";
import sha256 from "crypto-js/sha256";

import { Logger } from "@/services/logger";

import {
  CountryCode,
  Locale,
  TLD,
  DEVICE_REGISTRATION_DEFAULT_HEADERS,
  CLIENT_ID_SUFFIX,
} from "./constants";

export type DeviceRegistrationParams = {
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

export type OAuthParams = {
  deviceSerial: string; // A virtual device serial number, used in oauth and device registration
  codeVerifier: string; // A random byte string, used in oauth and device registration
  tld: TLD; // Top-level domain for the marketplace country (e.g. "com")
  authorizationCode: string; // Code received from oauth flow completion, used in device registration
};

const LOGGER = new Logger("DeviceRegistration");

// An audible device registration is required for authenticating
// other api routes, e.g. assets. A device registration is acquired
// by a user-driving oauth flow in a webview.
export class DeviceRegistration {
  private params: DeviceRegistrationParams;
  private encrypt: JSEncrypt;

  constructor(params: DeviceRegistrationParams) {
    this.params = params;
    this.encrypt = new JSEncrypt();
    this.encrypt.setKey(params.devicePrivateKey);
  }

  // Sign a request with the device's private key.
  public getSignedRequestHeaders({
    method,
    path,
    body,
    headers,
  }: {
    method: "GET";
    path: string;
    body: BodyInit | null;
    headers: Headers;
  }): Headers {
    const ts = new Date().toISOString();
    const serializedBody = (body ?? "").toString();

    const data = `${method}\n${path}\n${ts}\n${serializedBody}\n${this.params.adpToken}`;

    const signedData = this.encrypt.sign(data, sha256, "sha256");

    // Add the signed headers to the request headers
    headers.set("x-adp-token", this.params.adpToken);
    headers.set("x-adp-alg", "SHA256withRSA:1.0");
    headers.set("x-adp-signature", `${signedData}:${ts}`);

    return headers;
  }

  public getTLD(): TLD {
    // FIXME: remove fallback
    return this.params.tld ?? TLD.US;
  }

  public toJSON() {
    return JSON.stringify(this.params);
  }

  // Get the source and oauth params required for starting the
  // user driven oauth flow to be completed in a webview.
  public static async startOAuth({
    countryCode,
    deviceSerial,
  }: {
    countryCode: CountryCode;
    deviceSerial?: string;
  }): Promise<{
    source: { uri: string; headers: Record<string, string> };
    oauthParams: Omit<OAuthParams, "authorizationCode">;
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

  // Complete the user-driven oauth flow by exchanging a completed
  // oauth token for a device registration.
  public static async fromCompletedOAuth({
    oauthParams: { tld, codeVerifier, deviceSerial, authorizationCode },
    headers,
  }: {
    oauthParams: OAuthParams;
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

    LOGGER.debug("registerDevice complete", JSON.stringify(resBody));

    if (!res.ok) {
      throw new Error(
        `Device registration failed: ${res.statusText} ${JSON.stringify(
          resBody
        )}`
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
      (
        acc: Record<string, string>,
        cookie: { Name: string; Value: string }
      ) => ({
        ...acc,
        [cookie.Name]: cookie.Value.replaceAll('"', ""),
      }),
      {}
    );

    const deviceRegistration = new DeviceRegistration({
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
    });

    return deviceRegistration;
  }
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
