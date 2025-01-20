import { File } from "expo-file-system/next";

import { log } from "@/services/logger";

import { Client } from "./device-registration";
import { ProgressEvent } from "./progress-event";

const LOG_SERVICE_NAME = "audible/downloader";

export class Downloader {
  private client: Client;
  private source: URL;
  private destination: File;
  private force: boolean;
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

  public async execute(onProgress: (ev: ProgressEvent) => void): Promise<void> {
    let progressInterval: NodeJS.Timeout | null = null;
    try {
      const totalSize = await this.getTotalSize();

      if (
        !this.force &&
        this.destination.exists &&
        this.destination.size === totalSize
      ) {
        return; // File already completely downloaded
      }

      if (this.force && this.destination.exists) {
        this.destination.delete();
      }

      // Poll destination evey size to update progress
      progressInterval = setInterval(() => {
        onProgress(
          new ProgressEvent("download-progress", {
            loaded: this.destination.size ?? 0,
            total: totalSize,
          })
        );
      }, 1000);

      await File.downloadFileAsync(this.source.toString(), this.destination);
    } catch (error) {
      await this.cleanup();
      throw error;
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
  }

  // Get total size
  private async getTotalSize(): Promise<number> {
    const response = await this.client.fetch(this.source, {
      method: "HEAD",
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      throw new Error(
        `HEAD @ source failed: ${response.status} ${response.statusText}`
      );
    }

    return parseInt(response.headers.get("content-length") || "0", 10);
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.destination.exists) {
        this.destination.delete();
      }
    } catch (error) {
      log({
        service: LOG_SERVICE_NAME,
        level: "error",
        message: "Failed to cleanup files",
        data: { error, destinationUri: this.destination.uri },
      });
    }
  }
}
