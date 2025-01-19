import type { AudioSource } from "expo-audio";
import { File, Paths, Directory } from "expo-file-system/next";

import { log } from "@/services/logger";

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
import { Downloader } from "./downloader";
import { Client } from "./device-registration";

const LOGGER_SERVICE_NAME = "audible-service/asset";

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
  public async getPlaybackSource({
    onProgress,
  }: {
    onProgress: (ev: ProgressEvent) => void;
  }): Promise<AudioSource> {
    const sourceUrl = await (this.downloadSourceMetadata.fileType === "aax"
      ? this.getAAXUrl()
      : this.getAAXCUrl());

    const rawDirectory = new Directory(Paths.document, "raw");
    if (!rawDirectory.exists) {
      rawDirectory.create();
    }
    const rawFile = new File(
      rawDirectory,
      `${this.asin}.${this.downloadSourceMetadata.fileType}`
    );

    const downloader = new Downloader({
      client: this.client,
      source: sourceUrl,
      destination: rawFile,
    });

    await downloader.download(onProgress);

    log({
      service: LOGGER_SERVICE_NAME,
      level: "info",
      message: "getPlaybackSource: downloaded",
      data: { asin: this.asin },
    });

    throw new Error("Not implemented");
  }

  private async getAAXUrl(): Promise<URL> {
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

    if (!res.ok) {
      throw new Error(`Failed to get AAX url for asin ${this.asin}`);
    }

    return new URL(
      res.url.replace("cds.audible.com", `cds.audible.${this.client.getTLD()}`)
    );
  }

  private async getAAXCUrl(): Promise<URL> {
    throw new Error("Not implemented");
  }
}
