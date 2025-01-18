import type { AVPlaybackSource } from "expo-av";
import { Asset } from "../types";

import {
  LibraryItem,
  parseTitle,
  parseImageUrl,
  parseCreators,
  parseIsSourceAvailable,
  parseDownloadMetadata,
  DownloadSourceMetadata,
} from "./library";
import { Client } from "./device-registration";

type InstanceParams = {
  // audible library api data
  libraryItem: LibraryItem;

  client: Client;
};

export class AudibleAsset extends Asset {
  // Asset ID in audible api
  asin: LibraryItem["asin"];

  // remote source is available if published and consumable offline rights exist
  isRemoteSourceAvailable: boolean;

  // metadata for downloading the asset from source
  downloadSourceMetadata: DownloadSourceMetadata;

  // used for authenticating requests to download remote assets
  client: Client;

  constructor({ libraryItem, client }: InstanceParams) {
    super({
      id: `audible:${libraryItem.asin}`,
      title: parseTitle(libraryItem.title),
      imageUrl: parseImageUrl(libraryItem.product_images),
      creators: parseCreators(libraryItem.authors),
    });
    this.isRemoteSourceAvailable = parseIsSourceAvailable(libraryItem);
    this.downloadSourceMetadata = parseDownloadMetadata(libraryItem, "best");
    this.client = client;
    this.asin = libraryItem.asin;
  }

  // Audible files must be download as aax and converted to mp3 before playback
  public async getPlaybackSource(): Promise<AVPlaybackSource> {
    const sourceUrl = await (this.downloadSourceMetadata.fileType === "aax"
      ? this.getAAXUrl()
      : this.getAAXCUrl());

    throw new Error("Not implemented");
  }

  private async getAAXUrl(): Promise<string> {
    if (!this.isRemoteSourceAvailable) {
      throw new Error(`Remote source is not available for asin ${this.asin}`);
    }

    if (this.downloadSourceMetadata.fileType !== "aax") {
      throw new Error(`Remote source is not AAX for asin ${this.asin}`);
    }

    const query = new URLSearchParams({
      type: "AUDI",
      currentTransportMethod: "WIFI",
      key: this.asin,
      codec: this.downloadSourceMetadata.codecName,
    });

    const res = await this.client.fetch(
      new URL(
        `https://cde-ta-g7g.amazon.com/FionaCDEServiceEngine/FSDownloadContent?${query}`
      ),
      {
        method: "HEAD",
      }
    );

    const location = res.headers.get("location");
    if (!location) {
      throw new Error(`Could not get AAX URL for asin ${this.asin}`);
    }

    return location.replace(
      "cds.audible.com",
      `cds.audible.${this.client.getTLD()}`
    );
  }

  private async getAAXCUrl(): Promise<string> {
    throw new Error("Not implemented");
  }
}
