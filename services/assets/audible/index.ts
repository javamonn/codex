import { EventEmitter } from "eventemitter3";

import { AssetServiceInterface, Asset } from "../types";

import { DeviceRegistration } from "./api/device-registration";
import { getLibraryPage } from "./api/library";
import { Client } from "./api/client";

import { AudibleAsset } from "./asset";

// Params as serialized to JSON
export type AudibleAssetsServiceSerializedParams = {
  deviceRegistration: DeviceRegistration;
};

// Params as passed to the constructor
export type AudibleAssetsServiceParams = {
  deviceRegistration: DeviceRegistration;
};

type EventTypes = any;

export const AudibleAssetsService: AssetServiceInterface<
  AudibleAssetsServiceParams,
  EventTypes
> = class {
  private client: Client;
  private deviceRegistration: DeviceRegistration;
  private emitter: EventEmitter<EventTypes>;

  constructor(params: AudibleAssetsServiceParams | string) {
    if (typeof params === "string") {
      let serializedParams: AudibleAssetsServiceSerializedParams;
      try {
        serializedParams = JSON.parse(
          params
        ) as AudibleAssetsServiceSerializedParams;
      } catch (e) {
        throw new Error(
          `Failed to deserialize AudibleInstanceParams: ${e}, ${params}`
        );
      }

      if (!serializedParams.deviceRegistration) {
        throw new Error(
          `Missing required params in AudibleInstanceParams: ${params}`
        );
      }

      this.deviceRegistration = serializedParams.deviceRegistration;
    } else {
      this.deviceRegistration = params.deviceRegistration;
    }

    this.client = new Client({
      adpToken: this.deviceRegistration.adpToken,
      devicePrivateKey: this.deviceRegistration.devicePrivateKey,
      tld: this.deviceRegistration.tld,
    });
    this.emitter = new EventEmitter();
  }

  public toJSON() {
    return {
      deviceRegistration: this.deviceRegistration,
    };
  }

  public getEmitter(): Omit<typeof this.emitter, "emit"> {
    return this.emitter;
  }

  public async getAsset({ id }: { id: string }): Promise<Asset | null> {
    // TODO: Implement fetching a single asset, assume cache hit for now
    throw new Error("unimplemented");
  }

  public async getAssets({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }): Promise<Asset[]> {
    const libraryItems = await getLibraryPage({
      client: this.client,
      responseGroups: [
        "media",
        "product_attrs",
        "product_desc",
        "relationships",
        "series",
        "customer_rights",
      ],
      page,
      limit,
    });

    return libraryItems.reduce<AudibleAsset[]>((acc, libraryItem) => {
      const asset = new AudibleAsset({
        libraryItem,
        client: this.client,
      });

      acc.push(asset);
      return acc;
    }, []);
  }
};
