import { log } from "@/services/logger";

import { LibraryItem } from "./api/library-item";

const LOGGER_SERVICE_NAME = "audible-service/asset";

type SourceCodecMetadata =
  | { fileType: "aaxc" }
  | { fileType: "aax"; codec: string; codecName: string };

export type AudibleAsset = {
  type: "audible";
  id: LibraryItem["asin"];
  imageUrl: string;
  title: string;
  authors: string[];
  isDownloadable: boolean;
  sourceCodecMetadata: SourceCodecMetadata;
};

export const parseLibraryItem = (libraryItem: LibraryItem): AudibleAsset => ({
  type: "audible",
  id: `audible:${libraryItem.asin}`,
  title: parseTitle(libraryItem),
  imageUrl: parseImageUrl(libraryItem),
  authors: parseAuthors(libraryItem),
  isDownloadable: parseIsDownloadable(libraryItem),
  sourceCodecMetadata: parseSourceCodecMetadata(libraryItem, "best"),
});

// Parse the asset title from the library item
const parseTitle = (i: Pick<LibraryItem, "title">): string => {
  if (i.title === null) {
    throw new Error("No title found");
  }

  return i.title;
};

// Parse the highest resolution image URL from the library item
const parseImageUrl = (i: Pick<LibraryItem, "product_images">): string => {
  const urls = Object.entries(i.product_images)
    .map(([resolution, url]) => {
      let parsedResolution = 0;
      try {
        parsedResolution = parseInt(resolution);
      } catch (e) {
        // ignore
      }

      return { resolution: parsedResolution, url };
    })
    .sort((a, b) => b.resolution - a.resolution);

  if (urls.length === 0) {
    throw new Error("No image URLs found");
  }

  return urls[0].url;
};

// Parse the authors from the library item
const parseAuthors = (i: Pick<LibraryItem, "authors">): string[] => {
  if (i.authors.length === 0) {
    throw new Error("No authors found");
  }

  return i.authors.map((author) => author.name);
};

// Parse whether the asset is downloadable from the library item
const parseIsDownloadable = ({
  publication_datetime: publicationDatetime,
  customer_rights: customerRights,
}: Pick<LibraryItem, "publication_datetime" | "customer_rights">): boolean => {
  // Assets with no publication date are not published
  if (!publicationDatetime) {
    return false;
  }

  // If the publication date is in the future, the asset is not published
  if (new Date(publicationDatetime).getTime() > Date.now()) {
    return false;
  }

  // If the asset is not consumable offline, it is not playable
  if (!customerRights?.is_consumable_offline) {
    return false;
  }

  return true;
};

enum Codec {
  HIGH = "AAX_44_128",
  NORMAL = "AAX_44_64",
}

// Parse metadata required for source download from the library item.
export const parseSourceCodecMetadata = (
  {
    is_ayce: isAyce,
    available_codecs: availableCodecs,
  }: Pick<LibraryItem, "is_ayce" | "available_codecs">,
  targetQuality: "best" | "high" | "normal"
): SourceCodecMetadata => {
  if (isAyce || !availableCodecs || availableCodecs.length === 0) {
    return { fileType: "aaxc" };
  }

  let verify = null;
  if (targetQuality !== "best") {
    verify = targetQuality === "high" ? Codec.HIGH : Codec.NORMAL;
  }

  let best = [null, 0, 0, null] as [
    string | null,
    number,
    number,
    string | null
  ];

  for (const codec of availableCodecs) {
    // Check for exact quality match if verify is set
    if (verify && verify === codec.name.toUpperCase()) {
      return {
        fileType: "aax",
        codec: verify,
        codecName: codec.enhanced_codec,
      };
    }

    // Find best quality if no exact match needed or found
    if (codec.name.startsWith("aax_")) {
      const name = codec.name;
      try {
        const [sampleRate, bitrate] = name
          .slice(4)
          .split("_")
          .map((num) => parseInt(num, 10));

        if (sampleRate > best[1] || bitrate > best[2]) {
          best = [
            codec.name.toUpperCase(),
            sampleRate,
            bitrate,
            codec.enhanced_codec,
          ];
        }
      } catch (error) {
        log({
          level: "warn",
          message: `Unexpected codec name: ${name}`,
          service: LOGGER_SERVICE_NAME,
        });
        continue;
      }
    }
  }

  if (verify) {
    log({
      level: "warn",
      message: `${verify} codec was not found, using ${best[0]} instead`,
      service: LOGGER_SERVICE_NAME,
    });
  }

  return {
    fileType: "aax",
    codec: best[0]!,
    codecName: best[3]!,
  };
};
