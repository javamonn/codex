import { File } from "expo-file-system/next";
import {
  FFmpegKit,
  ReturnCode,
  FFmpegKitConfig,
  Level,
} from "ffmpeg-kit-react-native";

import { log } from "@/services/logger";

import { Client } from "./device-registration";
import { ProgressEvent } from "./progress-event";

FFmpegKitConfig.setLogLevel(Level.AV_LOG_DEBUG);

const LOG_SERVICE_NAME = "audible/converter";

export class Converter {
  private client: Client;
  private source: File;
  private destination: File;
  private tmpDestination: File | null = null;
  private force: boolean;

  constructor(params: {
    source: File;
    destination: File;
    client: Client;
    force?: boolean;
  }) {
    this.client = params.client;
    this.source = params.source;
    this.destination = params.destination;
    this.force = params.force ?? false;
  }

  public async execute(onProgress: (ev: ProgressEvent) => void): Promise<void> {
    try {
      if (!this.force && this.destination.exists) {
        return; // File already converted
      }

      if (!this.source.exists) {
        throw new Error(`Source file does not exist at ${this.source.uri}`);
      }

      if (this.force) {
        this.destination.delete();
      }

      await this.performConversion(onProgress);
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  private async performConversion(
    onProgress: (ev: ProgressEvent) => void
  ): Promise<void> {
    const activationBytes = await this.client.getActivationBytes();

    // Setup a tmp file used for the in-progress conversion. Moved to
    // intended destination on success.
    const tmpDestination = new File(`${this.destination.uri}-tmp.m4b`);
    if (tmpDestination.exists) {
      tmpDestination.delete();
    }
    tmpDestination.create();

    log({
      service: LOG_SERVICE_NAME,
      level: "info",
      message: "Starting conversion",
    });

    const cmd = `-activation_bytes ${activationBytes.toUpperCase()} -i ${
      this.source.uri
    } -c copy ${this.destination.uri}`;
    console.log("cmd", cmd);
    const session = await FFmpegKit.executeAsync(
      cmd,
      (session) => {
        log({
          service: LOG_SERVICE_NAME,
          level: "info",
          message: "Conversion complete",
          data: { id: session.getSessionId() },
        });
      },
      (l) => {
        log({
          service: LOG_SERVICE_NAME,
          level: "info",
          message: "Conversion log",
          data: { log: l.getMessage(), id: l.getSessionId() },
        });
      },
      (stats) => {
        log({
          service: LOG_SERVICE_NAME,
          level: "info",
          message: "Conversion stats",
          data: stats,
        });
      }
    );

    const returnCode = await session.getReturnCode();
    if (ReturnCode.isSuccess(returnCode)) {
      log({
        service: LOG_SERVICE_NAME,
        level: "info",
        message: "Conversion successful",
      });

      tmpDestination.move(this.destination);
    } else if (ReturnCode.isCancel(returnCode)) {
      log({
        service: LOG_SERVICE_NAME,
        level: "info",
        message: "Conversion cancelled",
      });
    } else {
      log({
        service: LOG_SERVICE_NAME,
        level: "error",
        message: "Conversion failed",
        data: { returnCode },
      });

      throw new Error("Conversion failed");
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.tmpDestination && this.tmpDestination.exists) {
        this.tmpDestination.delete();
      }

      if (this.destination.exists) {
        this.destination.delete();
      }
    } catch (error) {
      log({
        service: __filename,
        level: "error",
        message: "Failed to cleanup files",
        data: { error, destinationUri: this.destination.uri },
      });
    }
  }
}
