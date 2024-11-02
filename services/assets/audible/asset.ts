import { AVPlaybackSource } from "expo-av";
import { Asset } from "../types";

import { LibraryItem, Author } from "./library";
import { AssetSourceMetadata } from "./asset-source-metadata";

type InstanceParams = {
  libraryItem: LibraryItem;
  sourceMetadata: AssetSourceMetadata;
};

export class AudibleAsset extends Asset {
  sourceMetadata: AssetSourceMetadata;

  constructor({ libraryItem, sourceMetadata }: InstanceParams) {
    super({
      id: `audible:${libraryItem.asin}`,
      title: parseTitle(libraryItem.title),
      imageUrl: parseImageUrl(libraryItem.product_images),
      creators: parseCreators(libraryItem.authors),
    });
    this.sourceMetadata = sourceMetadata;
  }

  // Audible files must be download as aax and converted to mp3 before playback
  async getPlaybackSource(): Promise<AVPlaybackSource> {
    throw new Error("Not implemented");
  }
}

const parseTitle = (title: string | null): string => {
  if (title === null) {
    throw new Error("No title found");
  }

  return title;
};

// Get the highest resolution image URL from the product images
const parseImageUrl = (productImages: Record<string, string>): string => {
  const urls = Object.entries(productImages)
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

const parseCreators = (authors: Author[]): string[] => {
  if (authors.length === 0) {
    throw new Error("No authors found");
  }

  return authors.map((author) => author.name);
};
