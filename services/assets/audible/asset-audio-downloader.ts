import { Directory, Paths, File } from "expo-file-system/next";

import { assertResponseStatus } from "@/utils/assert-response-status";
import { log } from "@/services/logger";

import { ProgressEvent } from "../progress-event";

import { Client } from "./api/client";
import { getAAXSourceUrl } from "./api/download-content";
import { AudibleAsset } from "./audible-asset";

const LOGGER_SERVICE_NAME = "audible/asset-audio-downloader";

// The directory name where source audio files are stored
const SOURCE_AUDIO_PATH = "audible-asset-source-audio";

export const getOrDownload = async ({
  asset,
  client,
  forceDownload = false,
  onProgress,
}: {
  asset: AudibleAsset;
  client: Client;
  forceDownload?: boolean;
  onProgress: (ev: ProgressEvent) => void;
}): Promise<File> => {
  const destinationFile = getDestinationFile(asset);

  // Source already downloaded, return directly
  if (destinationFile.exists && !forceDownload) {
    return destinationFile;
  }

  // Download the source
  const sourceURL = await getSourceURL({ asset, client });
  return download({
    client,
    sourceURL,
    destinationFile,
    forceDownload,
    onProgress,
  });
};

const getSourceURL = ({
  asset,
  client,
}: {
  asset: AudibleAsset;
  client: Client;
}): Promise<URL> => {
  if (!asset.isDownloadable) {
    throw new Error(`Asset ${asset.id} is not downloadable`);
  }

  switch (asset.sourceCodecMetadata.fileType) {
    case "aax":
      return getAAXSourceUrl({
        client,
        asin: asset.id,
        codec: asset.sourceCodecMetadata.codecName,
      });
    case "aaxc":
      throw new Error("AAXC not supported");
    default:
      throw new Error(
        `Unknown source codec metadata: ${asset.sourceCodecMetadata}`
      );
  }
};

export const getDestinationFile = (asset: AudibleAsset): File => {
  const sourceAudioDirectory = new Directory(Paths.document, SOURCE_AUDIO_PATH);

  // Should only occur once per app install
  if (!sourceAudioDirectory.exists) {
    sourceAudioDirectory.create();
  }

  const fileName =
    asset.sourceCodecMetadata.fileType === "aax"
      ? `${asset.id}.${asset.sourceCodecMetadata.codec}.aax`
      : `${asset.id}.aaxc`;

  return new File(sourceAudioDirectory, fileName);
};

const download = async ({
  client,
  sourceURL,
  destinationFile,
  forceDownload,
  onProgress,
}: {
  client: Client;
  sourceURL: URL;
  destinationFile: File;
  forceDownload: boolean;
  onProgress: (ev: ProgressEvent) => void;
}): Promise<File> => {
  let totalSize: number | null = null;

  // Fetch total size concurrently with primary download task
  getSourceSize({ sourceURL, client })
    .then((size) => {
      totalSize = size;
    })
    .catch((err) => {
      log({
        level: "error",
        service: LOGGER_SERVICE_NAME,
        message: `Failed to fetch source size`,
        data: { sourceURL: sourceURL.toString(), error: err },
      });
    });

  // Temporary destination to avoid partial downloads
  const tmpDestinationFile = new File(
    destinationFile.parentDirectory,
    `${destinationFile.name}.tmp`
  );

  // Setup progress interval to poll destination file size
  const progressInterval = setInterval(() => {
    if (!totalSize || !tmpDestinationFile.exists) {
      return;
    }

    onProgress(
      new ProgressEvent("download-progress", {
        loaded: tmpDestinationFile.size ?? 0,
        total: totalSize,
      })
    );
  });

  try {
    if (forceDownload) {
      if (destinationFile.exists) {
        destinationFile.delete();
      }
      if (tmpDestinationFile.exists) {
        tmpDestinationFile.delete();
      }
    }

    const downloadedFile = await File.downloadFileAsync(
      sourceURL.toString(),
      tmpDestinationFile
    );
    downloadedFile.move(destinationFile);

    return destinationFile;
  } catch (error) {
    try {
      if (tmpDestinationFile.exists) {
        tmpDestinationFile.delete();
      }
      if (destinationFile.exists) {
        destinationFile.delete();
      }
    } catch (err) {
      log({
        level: "error",
        service: LOGGER_SERVICE_NAME,
        message: `Failed to cleanup files`,
        data: { error: err, destinationUri: destinationFile.uri },
      });
    }

    throw error;
  } finally {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  }
};

const getSourceSize = async ({
  sourceURL,
  client,
}: {
  sourceURL: URL;
  client: Client;
}): Promise<number> => {
  const res = await client.fetch(sourceURL, {
    method: "HEAD",
  });

  assertResponseStatus(res);

  return parseInt(res.headers.get("content-length") || "0", 10);
};
