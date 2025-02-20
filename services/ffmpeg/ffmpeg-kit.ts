import { File } from "expo-file-system/next";

import { log } from "@/services/logger";
import {
  FFmpegKitConfig,
  Level as FFmpegLogLevel,
  FFmpegKit,
  FFmpegSession,
  Log as FFmpegLog,
  Statistics as FFmpegStatistics,
  ReturnCode,
} from "ffmpeg-kit-react-native";

FFmpegKitConfig.setLogLevel(FFmpegLogLevel.AV_LOG_INFO);
const LOG_SERVICE_NAME = "audible/audio-converter/ffmpeg-kit-session";

type ConversionConfig = {
  onGetCommand: (inputURI: string, outputURI: string) => string;
  outputFormat: "wav" | "m4b";
};

// Converts an AAX input to an M4B output suitable for playback
export const getAAXToM4BConversionConfig = (
  activationBytes: string
): ConversionConfig => ({
  outputFormat: "m4b",
  onGetCommand: (inputURI: string, outputURI: string) =>
    `-activation_bytes ${activationBytes.toUpperCase()} -i ${inputURI} -c -copy ${outputURI}`,
});

// Converts an M4B input to a chunk of WAV audio suitable for transcribing with
// rn-whisper
export const getM4BToWAVChunkConversionConfig = ({
  chunkStartSeconds,
  chunkEndSeconds,
}: {
  chunkStartSeconds: string;
  chunkEndSeconds: string;
}): ConversionConfig => ({
  onGetCommand: (inputURI: string, outputURI: string) =>
    `-ar 16000 -ac 1 -c:a pcm_s16le -ss ${chunkStartSeconds} -t ${chunkEndSeconds} -i ${inputURI} ${outputURI}`,
  outputFormat: "wav",
});

export type ConvertParams = {
  source: File;
  destination: File;
  onProgress: (ev: ProgressEvent) => void;
  shouldForce?: boolean;
  abortSignal?: AbortSignal;
  config: ConversionConfig;
};

export const convert = async ({
  source,
  destination,
  onProgress,
  shouldForce,
  abortSignal,
  config: { onGetCommand, outputFormat },
}: ConvertParams): Promise<File> => {
  let tmpDestination: File | null = null;

  try {
    if (!shouldForce && destination.exists) {
      log({
        service: LOG_SERVICE_NAME,
        level: "info",
        message: "convert: noop, destination already exists",
        data: { uri: destination.uri },
      });
      return destination;
    }

    if (!source.exists) {
      throw new Error(`Source file does not exist at ${source.uri}`);
    }

    if (shouldForce && destination.exists) {
      destination.delete();
    }

    // In-progress conversions go to a tmp file which is renamed to destination upon completion
    tmpDestination = new File(`${destination.uri}.tmp.${outputFormat}`);

    const isSuccess = await executeSession({
      command: onGetCommand(source.uri, tmpDestination.uri),
      onProgress,
      sourceSize: source.size,
      abortSignal,
    });

    if (isSuccess) {
      // Conversion was successful
      tmpDestination.move(destination);

      return destination;
    } else {
      // Conversion was cancelled
      throw new Error("executeSession was cancelled");
    }
  } catch (error) {
    log({
      service: LOG_SERVICE_NAME,
      level: "error",
      message: "convert: failed",
      data: { error, sourceURI: source.uri, destinationURI: destination.uri },
    });

    handleSessionFailedCleanup({ tmpDestination, destination });

    throw error;
  }
};

const executeSession = ({
  command,
  onProgress,
  sourceSize,
  abortSignal,
}: {
  command: string;
  onProgress: (ev: ProgressEvent) => void;
  abortSignal?: AbortSignal;
  // Optional total size of the source file in bytes, used for progress reporting
  sourceSize: number | null;
}): Promise<boolean> => {
  let abortListener: (() => void) | null = null;

  const sessionOutcome = new Promise<boolean>((resolve, reject) => {
    const handleSession = async (session: FFmpegSession) => {
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        log({
          service: LOG_SERVICE_NAME,
          level: "info",
          message: "executeSession: conversion successful",
          data: { id: session.getSessionId() },
        });

        resolve(true);
      } else if (ReturnCode.isCancel(returnCode)) {
        log({
          service: LOG_SERVICE_NAME,
          level: "info",
          message: "executeSession: conversion cancelled",
          data: { id: session.getSessionId() },
        });

        resolve(false);
      } else {
        log({
          service: LOG_SERVICE_NAME,
          level: "error",
          message: "executeSession: conversion failed",
          data: { id: session.getSessionId() },
        });

        reject(new Error("Conversion failed"));
      }
    };

    const handleLog = (l: FFmpegLog) => {
      log({
        service: LOG_SERVICE_NAME,
        level: "info",
        message: "Conversion log",
        data: { log: l.getMessage(), id: l.getSessionId() },
      });
    };

    const handleStats = (stats: FFmpegStatistics) => {
      if (!sourceSize) {
        return;
      }

      onProgress(
        new ProgressEvent("conversion-progress", {
          loaded: stats.getSize(),
          total: sourceSize,
        })
      );
    };

    FFmpegKit.executeAsync(command, handleSession, handleLog, handleStats).then(
      (session) => {
        // Propagate abort signal to FFmpegKit session
        if (abortSignal) {
          abortListener = () => {
            session.cancel();
          };

          abortSignal.addEventListener("abort", abortListener);
        }
      }
    );
  });

  // Cleanup abort listener when session completes
  return sessionOutcome.finally(() => {
    if (abortSignal && abortListener) {
      abortSignal.removeEventListener("abort", abortListener);
    }
  });
};

const handleSessionFailedCleanup = ({
  tmpDestination,
  destination,
}: {
  tmpDestination: File | null;
  destination: File;
}) => {
  // cleanup tmpDestination if it was created
  try {
    if (tmpDestination && tmpDestination.exists) {
      tmpDestination.delete();
    }
    if (destination.exists) {
      destination.delete();
    }
  } catch (error) {
    log({
      service: LOG_SERVICE_NAME,
      level: "error",
      message: "createSession: failed to cleanup files",
      data: { error },
    });
  }
};
