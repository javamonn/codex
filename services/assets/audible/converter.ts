import { File } from "expo-file-system/next";
import {
  FFmpegKit,
  ReturnCode,
  FFmpegKitConfig,
  Level,
} from "ffmpeg-kit-react-native";

import { log } from "@/services/logger";

import type { Client } from "./api/client";
import { ProgressEvent } from "./progress-event";

FFmpegKitConfig.setLogLevel(Level.AV_LOG_INFO);

const LOG_SERVICE_NAME = "audible/converter";

export const CONVERSION_TARGET_FORMAT = "wav";

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
    this.force = params.force ?? true;
  }

  public async execute(onProgress: (ev: ProgressEvent) => void): Promise<void> {
    try {
      if (!this.force && this.destination.exists) {
        return; // File already converted
      }

      if (!this.source.exists) {
        throw new Error(`Source file does not exist at ${this.source.uri}`);
      }

      if (this.force && this.destination.exists) {
        this.destination.delete();
      }

      console.log("before performConversion");
      await this.performConversion(onProgress);
      console.log("after performConversion");
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
    const tmpDestination = new File(
      `${this.destination.uri}.tmp.${CONVERSION_TARGET_FORMAT}`
    );
    if (tmpDestination.exists) {
      tmpDestination.delete();
    }

    log({
      service: LOG_SERVICE_NAME,
      level: "info",
      message: "Starting conversion",
    });

    // TODO: convert to m4b for playback and wav chunks for transcription
    const CHUNK_OPTS = "-ss 0 -t 600";
    const WAV_OPTS = "-ar 16000 -ac 1 -c:a pcm_s16le";
    const M4B_OPTS = "-c copy";
    const cmd = `-activation_bytes ${activationBytes.toUpperCase()} ${CHUNK_OPTS} -i ${
      this.source.uri
    } ${WAV_OPTS} ${tmpDestination.uri} `;
    console.log("cmd", cmd);
    const totalSize = this.source.size;

    return new Promise((resolve, reject) => {
      FFmpegKit.executeAsync(
        cmd,
        (session) => {
          log({
            service: LOG_SERVICE_NAME,
            level: "info",
            message: "Conversion complete",
            data: { id: session.getSessionId() },
          });

          session.getReturnCode().then((returnCode) => {
            if (ReturnCode.isSuccess(returnCode)) {
              log({
                service: LOG_SERVICE_NAME,
                level: "info",
                message: "Conversion successful",
              });

              console.log("moving file begin");
              tmpDestination.move(this.destination);
              console.log("moving file complete");
              resolve(void 0);
            } else if (ReturnCode.isCancel(returnCode)) {
              log({
                service: LOG_SERVICE_NAME,
                level: "info",
                message: "Conversion cancelled",
              });
              resolve(void 0);
            } else {
              log({
                service: LOG_SERVICE_NAME,
                level: "error",
                message: "Conversion failed",
                data: { returnCode },
              });

              reject(new Error("Conversion failed"));
            }
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
          onProgress(
            new ProgressEvent("conversion-progress", {
              loaded: stats.getSize(),
              total: totalSize ?? 0,
            })
          );
        }
      );
    });
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
