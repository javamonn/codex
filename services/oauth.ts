import { EventEmitter } from "eventemitter3";

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

  public async applyRequestHeaders(headers: Headers): Promise<void> {
    if (this.isExpired()) {
      await this.refreshToken();
    }

    headers.append("Authorization", `Bearer ${this.token.accessToken}`);
    headers.append("client-id", "0");
  }

  public serialize(): string {
    return JSON.stringify(this.token);
  }

  public isExpired(): boolean {
    return Date.now() > this.token.expiresAt;
  }

  private async refreshToken(): Promise<void> {
    this.token = await this.onRefreshToken(this.token.refreshToken);
    this.emitter.emit("token_refreshed");
  }

  public getEmitter(): Omit<typeof this.emitter, "emit"> {
    return this.emitter;
  }
}
