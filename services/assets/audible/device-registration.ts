import {
  randomUUID,
  getRandomBytesAsync,
  digestStringAsync,
  CryptoDigestAlgorithm,
  CryptoEncoding,
} from "expo-crypto";
import { fetch } from "expo/fetch";

import { log } from "@/services/logger";
import {
  CountryCode,
  Locale,
  TLD,
  DEVICE_REGISTRATION_DEFAULT_HEADERS,
  CLIENT_ID_SUFFIX,
} from "./api/constants";
import { Client } from "./api/client"

const LOGGER_SERVICE_NAME = "audible-service/device-registration";

// An audible device registration is required for authenticating
// other api routes, e.g. assets. A device registration is acquired
// by a user-driving oauth flow in a webview.
export class DeviceRegistration {
  private params: DeviceRegistrationParams;
  private client: Client | null;

  constructor(params: DeviceRegistrationParams) {
    this.params = params;
    this.client = null;
  }

  public getClient(): Client {
    if (this.client === null) {
      this.client = new Client({
        adpToken: this.params.adpToken,
        devicePrivateKey: this.params.devicePrivateKey,
        tld: this.params.tld ?? TLD.US,
      });
    }

    return this.client;
  }

  public toJSON() {
    return this.params
  }


