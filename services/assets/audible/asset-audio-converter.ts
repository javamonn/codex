import { Directory, Paths, File } from "expo-file-system/next";

import { Client } from "./api/client";
import { AudibleAsset } from "./audible-asset";
import { getDestinationFile as getDownloadDestinationFile } from "./asset-audio-downloader";
import { convertFromAAXToM4B } from "@/services/ffmpeg";

// Note: shared by all assets regardless of type
const AUDIO_PATH = "asset-audio";

export const getOrConvert = async ({
  client,
  asset,
  abortSignal,
  sourceFile: inputSourceFile,
  destinationFile: inputDestinationFile,
  forceConvert = false,
  onProgress,
}: {
  client: Client;
  asset: AudibleAsset;
  sourceFile?: File;
  destinationFile?: File;
  forceConvert?: boolean;
  abortSignal: AbortSignal;
  onProgress: (ev: ProgressEvent) => void;
}): Promise<File> => {
  const sourceFile = inputSourceFile ?? getDownloadDestinationFile(asset);
  const destinationFile = inputDestinationFile ?? getDestinationFile(asset);

  // Converter does these prechecks already, but doing here saves a call
  // to fetch activation bytes if we early exit

  // Source already converted, return directly
  if (!forceConvert && destinationFile.exists) {
    return destinationFile;
  }

  // Missing source, unable to convert
  if (!sourceFile.exists) {
    throw new Error(`Source file does not exist at ${sourceFile.uri}`);
  }

  const activationBytes = await client.getActivationBytes();

  return convertFromAAXToM4B({
    activationBytes,
    source: sourceFile,
    destination: destinationFile,
    onProgress,
    abortSignal,
    shouldForce: forceConvert,
  });
};

export const getDestinationFile = (asset: AudibleAsset): File => {
  const audioDirectory = new Directory(Paths.document, AUDIO_PATH);

  // Should only occur once per app install
  if (!audioDirectory.exists) {
    audioDirectory.create();
  }

  const fileName = `audible-${asset.id}.m4b`;

  return new File(audioDirectory, fileName);
};
