import { File } from "expo-file-system/next";

import { Client } from "./device-registration";

export type ProgressCallback = (params: {
  bytesDownloaded: number;
  totalBytes: number;
  percent: number;
}) => void;

export class Downloader {
  private client: Client;
  private source: URL;
  private destination: File;
  private force: boolean;
  private rangeSupported: boolean = false;
  private totalSize: number = 0;
  private abortController: AbortController;

  constructor(params: {
    client: Client;
    source: URL;
    destination: File;
    force?: boolean;
  }) {
    this.client = params.client;
    this.source = params.source;
    this.destination = params.destination;
    this.force = params.force ?? false;
    this.abortController = new AbortController();
  }

  public async download(
    onProgress: (ev: ProgressEvent) => void
  ): Promise<void> {
    try {
      await this.prepareDownload();

      if (
        !this.force &&
        this.destination.exists &&
        this.destination.size === this.totalSize
      ) {
        return; // File already completely downloaded
      }

      if (this.force) {
        this.destination.delete();
      }

      this.destination.create();

      await this.performDownload(onProgress);
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  // Check range support and get total size
  private async prepareDownload(): Promise<void> {
    const response = await this.client.fetch(this.source, {
      method: "HEAD",
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to prepare download: ${response.status} ${response.statusText}`
      );
    }

    this.totalSize = parseInt(
      response.headers.get("content-length") || "0",
      10
    );
    if (!this.totalSize) {
      throw new Error("Could not determine file size");
    }

    this.rangeSupported = response.headers.get("accept-ranges") === "bytes";
  }

  // Execute the download, resuming if possible
  private async performDownload(
    onProgress: (ev: ProgressEvent) => void
  ): Promise<void> {
    let resumePosition = 0;
    if (this.rangeSupported && !this.force && this.destination.exists) {
      resumePosition = this.destination.size ?? 0;
      if (resumePosition >= this.totalSize) {
        resumePosition = 0; // Start over if something seems wrong
      }
    }

    const headers: HeadersInit = {};
    if (resumePosition > 0) {
      headers["Range"] = `bytes=${resumePosition}-`;
    }

    const response = await this.client.fetch(this.source, {
      headers,
      signal: this.abortController.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(
        `Failed to download: ${response.status} ${response.statusText}`
      );
    }

    const progressInterval = setInterval(() => {
      onProgress(
        new ProgressEvent("download-progress", {
          loaded: this.destination.size ?? 0,
          total: this.totalSize,
        })
      );
    }, 1000);
    try {
      await response.body.pipeTo(this.destination.writableStream(), {
        signal: this.abortController.signal,
      });
    } finally {
      clearInterval(progressInterval);
    }

    if (this.destination.size !== this.totalSize) {
      throw new Error(
        `Downloaded file size does not match expected size, expected ${this.totalSize} bytes but got ${this.destination.size} bytes`
      );
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.destination.exists) {
        this.destination.delete();
      }
    } catch (error) {
      console.error("Failed to cleanup:", error);
    }
  }
}
