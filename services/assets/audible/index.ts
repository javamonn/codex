import { EventEmitter } from "eventemitter3";

import { AssetServiceInterface, Asset } from "../types";

import {
  DeviceRegistration,
  DeviceRegistrationParams,
} from "./device-registration";
import { getLibraryPage } from "./library";
import { AudibleAsset } from "./asset";

// Params as serialized to JSON
export type AudibleAssetsServiceSerializedParams = {
  deviceRegistration: DeviceRegistrationParams;
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
  private deviceRegistration: DeviceRegistration;
  private emitter: EventEmitter<EventTypes>;
  private assetCache: Map<string, Asset> = new Map();

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

      this.deviceRegistration = new DeviceRegistration(
        serializedParams.deviceRegistration
      );
    } else {
      this.deviceRegistration = params.deviceRegistration;
    }

    this.emitter = new EventEmitter();
  }

  public toJSON(): string {
    return JSON.stringify({
      deviceRegistration: this.deviceRegistration,
    });
  }

  public getEmitter(): Omit<typeof this.emitter, "emit"> {
    return this.emitter;
  }

  public async getAsset({ id }: { id: string }): Promise<Asset | null> {
    const asset = this.assetCache.get(id);
    if (asset) {
      return asset;
    }

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
    const client = this.deviceRegistration.getClient();
    const libraryItems = await getLibraryPage({
      client,
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
        client,
      });

      this.assetCache.set(asset.id, asset);

      acc.push(asset);
      return acc;
    }, []);
  }
};

// reexports
export { CountryCode } from "./constants";
export { OAuthParams, DeviceRegistration } from "./device-registration";
