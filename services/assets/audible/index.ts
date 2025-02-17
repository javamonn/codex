import { EventEmitter } from "eventemitter3";

import { AssetServiceInterface, Asset, AssetId } from "../types";

import { DeviceRegistration } from "./api/device-registration";
import { getLibraryPage, getLibraryItem, ResponseGroup } from "./api/library";
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

const LIBRARY_ITEM_RESPONSE_GROUPS: ResponseGroup[] = [
  "media",
  "product_attrs",
  "product_desc",
  "relationships",
  "series",
  "customer_rights",
];

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

  public async getAsset({ id }: { id: AssetId }): Promise<Asset | null> {
    const libraryItem = await getLibraryItem({
      client: this.client,
      responseGroups: LIBRARY_ITEM_RESPONSE_GROUPS,
      asin: AudibleAsset.parseAsin(id),
    });

    return new AudibleAsset({ libraryItem, client: this.client });
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
      responseGroups: LIBRARY_ITEM_RESPONSE_GROUPS,
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
