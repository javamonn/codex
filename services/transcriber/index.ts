import { TranscribeResult } from "whisper.rn";
import { Directory, Paths, File } from "expo-file-system/next";

import { log } from "../logger";
import { WhisperService } from "../whisper";
import { convertFromM4BToWAVChunk } from "../ffmpeg";
import { ProgressEvent, ProgressEventHandler } from "../assets/progress-event";

const LOGGER_SERVICE_NAME = "services/transcriber";

// The directory to store transcriber text output file cache.
const TEXT_SEGMENTS_PATH = "transcriber-text-segments";
// The directory to store transcriber wav chunk output file cache.
const WAV_CHUNK_PATH = "transcriber-wav-chunk";

/*
 * Transcribes a chunk of audio from a local M4B file into text. A local whisper
 * service is responsible for the transcription.
 *
 * Whisper expects a WAV file as input, so we first convert a local M4B file into
 * a WAV file with the proper encoding using ffmpeg. Whisper has memory constraints
 * around input size so we only transcribe a discrete chunk of the input file at
 * a time.
 */

// TODO: onProgress callback to emit results via whisper new segments callback
// TODO: need to clean up file caches
export const getAudioSourceTextSegments = async ({
  id,
  audioSource,
  chunkStartSeconds,
  chunkEndSeconds,
  abortSignal,
  onProgress,
  whisper,
}: {
  // Stable identifier for the source
  id: string;
  // The M4B audio source
  audioSource: { uri: string };
  // The start time in seconds of the audio source to transcribe
  chunkStartSeconds: number;
  // The end time in seconds of the audio source to transcribe
  chunkEndSeconds: number;
  // The whisper service to use for the transcription
  whisper: WhisperService;
  // A signal to abort the transcription
  abortSignal: AbortSignal;
  // A callback to report progress, emits conversion-progress and transcription-progress events
  onProgress: ProgressEventHandler;
}): Promise<TranscribeResult["segments"]> => {
  const textSegmentsFile = getTextSegmentsFile({
    id,
    chunkStartSeconds,
    chunkEndSeconds,
  });

  // Return the text segments directly from cache if they exist
  if (textSegmentsFile.exists) {
    try {
      return JSON.parse(
        textSegmentsFile.text()
      ) as TranscribeResult["segments"];
    } catch (error) {
      // Failed to parse the text segments from cache, continue with transcription
      try {
        textSegmentsFile.delete();
      } catch (error) {
        log({
          service: LOGGER_SERVICE_NAME,
          level: "error",
          data: { error },
          message:
            "Failed to delete the text segments file after parsing error",
        });
      }

      log({
        service: LOGGER_SERVICE_NAME,
        level: "error",
        data: { error },
        message: "Failed to parse the text segments from cache",
      });
    }
  }

  // Get the WAV chunk file for the given chunk of audio, create it if necessary
  let wavChunkFile = getWavChunkFile({
    id,
    chunkStartSeconds,
    chunkEndSeconds,
  });
  if (!wavChunkFile.exists) {
    const source = new File(audioSource.uri);
    if (!source.exists) {
      throw new Error(`Source file does not exist at ${source.uri}`);
    }
    if (source.extension !== ".m4b") {
      throw new Error(
        `Source file must be an M4B file, received "${source.extension}"`
      );
    }

    // Perform the conversion from M4B to WAV chunk
    wavChunkFile = await convertFromM4BToWAVChunk({
      source,
      destination: wavChunkFile,
      chunkStartSeconds,
      chunkEndSeconds,
      onProgress,
      abortSignal,
    });
  }

  // Transcribe the WAV chunk
  const transcribeResult = await whisper.exec({
    uri: wavChunkFile.uri,
    abortSignal,
    transcribeOptions: {
      onProgress: (progress) => {
        onProgress(
          new ProgressEvent("transcription-progress", {
            loaded: progress,
            total: 100,
          })
        );
      },
    },
  });

  // Cache the transcribe result to disk
  try {
    if (textSegmentsFile.exists) {
      textSegmentsFile.delete();
    }

    textSegmentsFile.create();
    textSegmentsFile.write(JSON.stringify(transcribeResult.segments));
  } catch (error) {
    log({
      service: LOGGER_SERVICE_NAME,
      level: "error",
      data: { error },
      message: "Failed to cache the transcribe result",
    });
  }

  return transcribeResult.segments;
};

const getTextSegmentsFile = ({
  id,
  chunkStartSeconds,
  chunkEndSeconds,
}: {
  id: string;
  chunkStartSeconds: number;
  chunkEndSeconds: number;
}): File => {
  const textSegmentsDirectory = new Directory(Paths.cache, TEXT_SEGMENTS_PATH);

  // Should only occur once per app install
  if (!textSegmentsDirectory.exists) {
    textSegmentsDirectory.create();
  }

  const fileName = `${id}-${chunkStartSeconds}-${chunkEndSeconds}.json`;

  return new File(textSegmentsDirectory, fileName);
};

const getWavChunkFile = ({
  id,
  chunkStartSeconds,
  chunkEndSeconds,
}: {
  id: string;
  chunkStartSeconds: number;
  chunkEndSeconds: number;
}): File => {
  const wavChunkDirectory = new Directory(Paths.cache, WAV_CHUNK_PATH);

  // Should only occur once per app install
  if (!wavChunkDirectory.exists) {
    wavChunkDirectory.create();
  }

  const fileName = `${id}-${chunkStartSeconds}-${chunkEndSeconds}.wav`;

  return new File(wavChunkDirectory, fileName);
};
