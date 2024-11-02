import { EventEmitter } from "eventemitter3";

import { AssetServiceInterface, Asset, GetAsssetParams } from "../types";

import {
  DeviceRegistration,
  DeviceRegistrationParams,
} from "./device-registration";
import { getLibraryPage } from "./library";
import { AssetSourceMetadata } from "./asset-source-metadata";
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

  public async getAssets({ page, limit }: GetAsssetParams): Promise<Asset[]> {
    const libraryItems = await getLibraryPage({
      deviceRegistration: this.deviceRegistration,
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

    const sourceMetadataByAsin = await AssetSourceMetadata.getManyByAsin(
      libraryItems
    );

    return libraryItems.map((libraryItem) => {
      const sourceMetadata = sourceMetadataByAsin[libraryItem.asin] ?? null;
      return new AudibleAsset({ libraryItem, sourceMetadata });
    });
  }
};

// reexports
export { CountryCode } from "./constants";
export { OAuthParams, DeviceRegistration } from "./device-registration";
