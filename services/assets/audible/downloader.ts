import { File, Paths } from "expo-file-system/next";

import { Client } from "./device-registration";

const MIN_STREAM_LENGTH = 10 * 1024 * 1024; // using stream mode if source is greater than
const MIN_RESUME_FILE_LENGTH = 10 * 1024 * 1024; // keep resume file if file is greater than
const RESUME_SUFFIX = ".resume";
const TMP_SUFFIX = ".tmp";

type Outcome = { type: "DestinationExists" };

type DownloaderParams = {
  source: string;
  destination: File;
  client: Client;
  force: boolean;
};

export class Downloader {
  client: Client;
  source: string;
  destination: File;
  force: boolean;

  constructor({ source, destination, client, force }: DownloaderParams) {
    this.source = source;
    this.destination = destination;
    this.client = client;
    this.force = force;
  }

  private async getHeadResponse(): Promise<Response> {
    const res = await this.client.fetch(new URL(this.source), {
      method: "HEAD",
    });

    if (res.url !== this.source) {
      this.source = res.url;
    }

    return res;
  }

  public async run(): Promise<Outcome> {
    if (this.destination.exists && !this.force) {
      return { type: "DestinationExists" } as Outcome;
    }

    const headRes = await this.getHeadResponse();
  }
}
