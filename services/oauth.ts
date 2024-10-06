import { EventEmitter } from "eventemitter3";
import { Logger } from "./logger";

const LOGGER = new Logger("OAuthService");

export type OAuthToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export class OAuthService {
  private token: OAuthToken;
  private onRefreshToken: (refreshToken: string) => Promise<OAuthToken>;
  private emitter: EventEmitter<"token_refreshed">;

  constructor(
    params: OAuthToken | string,
    onRefreshToken: (refreshToken: string) => Promise<OAuthToken>
  ) {
    let parsedParams;

    if (typeof params === "string") {
      try {
        parsedParams = JSON.parse(params);
      } catch (e) {
        throw new Error(`Failed to deserialize OAuthToken: ${e}, ${params}`);
      }
    } else {
      parsedParams = params;
    }

    if (
      !parsedParams.accessToken ||
      !parsedParams.refreshToken ||
      !parsedParams.expiresAt
    ) {
      throw new Error(`Missing required params in OAuthToken: ${params}`);
    }

    this.token = parsedParams;
    this.onRefreshToken = onRefreshToken;
    this.emitter = new EventEmitter();
  }

  public async getAccessToken(): Promise<string> {
    if (this.isExpired()) {
      await this.refreshToken();
    }

    return this.token.accessToken;
  }

  public serialize(): string {
    return JSON.stringify(this.token);
  }

  public isExpired(): boolean {
    return Date.now() > this.token.expiresAt;
  }

  private async refreshToken(): Promise<void> {
    try {
      this.token = await this.onRefreshToken(this.token.refreshToken);
      this.emitter.emit("token_refreshed");

      LOGGER.info("refreshToken: token_refreshed");
    } catch (e) {
      LOGGER.error("refreshToken", e as Error);
      throw e;
    }
  }

  public getEmitter(): Omit<typeof this.emitter, "emit"> {
    return this.emitter;
  }
}
