import { File } from "expo-file-system/next";

import {
  convert,
  getAAXToM4BConversionConfig,
  getM4BToWAVChunkConversionConfig,
  ConvertParams,
} from "./ffmpeg-kit";

export const convertFromAAXToM4B = ({
  activationBytes,
  ...convertParams
}: Omit<ConvertParams, "config"> & {
  activationBytes: string;
}): Promise<File> => {
  return convert({
    ...convertParams,
    config: getAAXToM4BConversionConfig(activationBytes),
  });
};

export const convertFromM4BToWAVChunk = ({
  chunkStartSeconds,
  chunkEndSeconds,
  ...convertParams
}: Omit<ConvertParams, "config"> & {
  chunkStartSeconds: number;
  chunkEndSeconds: number;
}): Promise<File> => {
  return convert({
    ...convertParams,
    config: getM4BToWAVChunkConversionConfig({
      chunkStartSeconds: chunkStartSeconds,
      chunkEndSeconds: chunkEndSeconds,
    }),
  });
};
