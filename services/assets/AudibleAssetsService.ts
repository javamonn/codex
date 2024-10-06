import { AssetServiceInterface, Asset } from "./types";
import {
  DeviceRegistration,
  getLibraryPage,
  refreshOAuthToken,
  TLD,
} from "@/services/audible";
import { OAuthToken, OAuthService } from "@/services/oauth";
import { EventEmitter } from "eventemitter3";
import { CLIENT_ID_SUFFIX, encodeHex } from "../audible/auth";

export type AudibleInstanceParams = {
  tld: TLD;
  deviceRegistration: DeviceRegistration;
  oauthToken: OAuthToken;
};

type EventTypes = "oauth_token_refreshed";

export const AudibleAssetsService: AssetServiceInterface<
  AudibleInstanceParams,
  EventTypes
> = class {
  private deviceRegistration: DeviceRegistration;
  private oauthService: OAuthService;
  private emitter: EventEmitter<EventTypes>;
  private tld: TLD;

  constructor(params: AudibleInstanceParams | string) {
    let parsedParams: AudibleInstanceParams;
    if (typeof params === "string") {
      try {
        parsedParams = JSON.parse(params);
      } catch (e) {
        throw new Error(
          `Failed to deserialize AudibleInstanceParams: ${e}, ${params}`
        );
      }
    } else {
      parsedParams = params;
    }

    console.log("parsedParams", parsedParams);

    if (
      !parsedParams.deviceRegistration ||
      !parsedParams.oauthToken ||
      !parsedParams.tld
    ) {
      throw new Error(
        `Missing required params in AudibleInstanceParams: ${params}`
      );
    }

    this.emitter = new EventEmitter();
    this.deviceRegistration = parsedParams.deviceRegistration;
    this.tld = parsedParams.tld;
    this.oauthService = new OAuthService(
      parsedParams.oauthToken,
      (refreshToken) =>
        refreshOAuthToken({ refreshToken, tld: parsedParams.tld })
    );

    this.oauthService.getEmitter().on("token_refreshed", () => {
      this.emitter.emit("oauth_token_refreshed");
    });
  }

  public getSerializedParams(): string {
    return JSON.stringify({
      deviceRegistration: this.deviceRegistration,
      oauthToken: this.oauthService.serialize(),
      tld: this.tld,
    });
  }

  public getEmitter(): Omit<typeof this.emitter, "emit"> {
    return this.emitter;
  }

  public async getAssets(): Promise<Asset[]> {
    const headers = await this.getRequestHeaders();
    const assets = await getLibraryPage({
      authHeaders: headers,
      tld: this.tld,
    });

    console.log("assets", assets);

    return assets;
  }

  private async getRequestHeaders(): Promise<Headers> {
    const headers = new Headers({
      "client-id": "0",
    });
    const accessToken = await this.oauthService.getAccessToken();
    headers.set("Authorization", `Bearer ${accessToken}`);
    return headers;
  }
};
