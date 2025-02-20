import JSEncrypt from "jsencrypt";
import sha256 from "crypto-js/sha256";
import { FetchRequestInit } from "expo/fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { audibleActivationBytesKey } from "@/utils/async-storage-key";

import { getActivationBytes } from "./activation-bytes";
import { TLD } from "./constants"

export class Client {
  activationBytes: string | null = null;
  adpToken: string;
  encrypt: JSEncrypt;
  tld: TLD;

  constructor({
    adpToken,
    devicePrivateKey,
    tld,
  }: {
    adpToken: string;
    devicePrivateKey: string;
    tld: TLD;
  }) {
    this.adpToken = adpToken;
    this.tld = tld;
    this.encrypt = new JSEncrypt();
    this.encrypt.setKey(devicePrivateKey);
  }

  public fetch(
    url: URL,
    options: FetchRequestInit & { headers?: Record<string, string> }
  ): Promise<Response> {
    const ts = new Date().toISOString();
    const data = [
      options.method ?? "GET",
      url.pathname + url.search,
      ts,
      (options.body ?? "").toString(),
      this.adpToken,
    ].join("\n");

    const signedData = this.encrypt.sign(
      data,
      sha256 as unknown as (str: string) => string,
      "sha256"
    );

    // Add the signed headers to the request headers
    if (!options.headers) {
      options.headers = {};
    }
    options.headers["x-adp-token"] = this.adpToken;
    options.headers["x-adp-alg"] = "SHA256withRSA:1.0";
    options.headers["x-adp-signature"] = `${signedData}:${ts}`;

    return fetch(url.toString(), options);
  }

  public getTLD(): TLD {
    return this.tld;
  }

  // Activation bytes are required for AAX to M4B conversion and are static per
  // device. We cache the value in memory + AsyncStorage to avoid unnecessary
  // requests.
  public async getActivationBytes(): Promise<string> {
    // attempt fetch from cache
    if (!this.activationBytes) {
      const cachedActivationBytes = await AsyncStorage.getItem(
        audibleActivationBytesKey
      );
      if (cachedActivationBytes) {
        this.activationBytes = cachedActivationBytes;
      }
    }

    // fetch from audible
    if (!this.activationBytes) {
      const activationBytes = await getActivationBytes({ client: this });
      this.activationBytes = activationBytes;
    }

    return this.activationBytes;
  }
}
