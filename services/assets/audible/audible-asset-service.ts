import { EventEmitter } from "eventemitter3";

import { AssetService } from "../asset-service";
import { ProgressEvent } from "../progress-event";

import { DeviceRegistration } from "./api/device-registration";
import { getLibraryPage, getLibraryItem, ResponseGroup } from "./api/library";
import { Client } from "./api/client";
import { AudibleAsset, parseLibraryItem } from "./audible-asset";
import { getOrDownload } from "./asset-audio-downloader";
import {
  getOrConvert,
  getDestinationFile as getConvertedDestinationFile,
} from "./asset-audio-converter";

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

export class AudibleAssetService extends AssetService<
  AudibleAsset,
  EventTypes
> {
  private client: Client;
  private deviceRegistration: DeviceRegistration;
  private emitter: EventEmitter<EventTypes>;

  constructor(params: AudibleAssetsServiceParams | string) {
    super();
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

  public async getAsset({ id }: { id: string }): Promise<AudibleAsset | null> {
    const libraryItem = await getLibraryItem({
      client: this.client,
      responseGroups: LIBRARY_ITEM_RESPONSE_GROUPS,
      asin: id,
    });

    return parseLibraryItem(libraryItem);
  }

  public async getAssetAudioSource({
    asset,
    abortSignal,
    onProgress,
  }: {
    asset: AudibleAsset;
    abortSignal: AbortSignal;
    onProgress: (ev: ProgressEvent) => void;
  }): Promise<{ uri: string }> {
    // If converted file exists, return it directly as we will have removed the
    // intermediate downloaded file post-conversion.
    const convertedDestinationFile = getConvertedDestinationFile(asset);
    if (convertedDestinationFile.exists) {
      return { uri: convertedDestinationFile.uri };
    }

    // Download the source file if necessary 
    const downloadedFile = await getOrDownload({
      asset,
      client: this.client,
      onProgress,
    });

    // Convert the downloaded file if necessary
    const convertedFile = await getOrConvert({
      client: this.client,
      asset,
      sourceFile: downloadedFile,
      abortSignal,
      forceConvert: false,
      onProgress,
    });

    // Remove the downloaded file once conversion is complete
    downloadedFile.delete();

    return { uri: convertedFile.uri };
  }

  public async getAssets({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }): Promise<AudibleAsset[]> {
    const libraryItems = await getLibraryPage({
      client: this.client,
      responseGroups: LIBRARY_ITEM_RESPONSE_GROUPS,
      page,
      limit,
    });

    return libraryItems.map((libraryItem) => parseLibraryItem(libraryItem));
  }
}
