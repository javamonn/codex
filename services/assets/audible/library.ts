import { assertResponseStatus } from "@/utils";
import { log } from "@/services/logger";

import { Client } from "./device-registration";
import { TLD } from "./constants";

const LOGGER_SERVICE_NAME = "audible-service/library";

export type ContentDeliveryType = "SinglePartBook" | "MultiPartBook";
export type Author = { asin: string; name: string };
export type LibraryItem = {
  asin: string;
  title: string | null;
  content_delivery_type: ContentDeliveryType;
  authors: Author[];
  publication_datetime: string | null;
  customer_rights: {
    is_consumable_offline: boolean | null;
  } | null;

  is_ayce: boolean;
  available_codecs: { name: string; enhanced_codec: string }[];

  // keyed by resolution
  product_images: Record<string, string>;

  // MultiPartBooks and Podcasts
  relationships: {
    asin: string;
    content_delivery_type: ContentDeliveryType | null;
    relationship_to_product: "child";
    relationship_type: "component";
    sequence: unknown | null;
    sku: string | null;
    sku_lite: string | null;
    sort: string | null;
    title: string | null;
    url: string | null;
  }[];
};

export async function getLibraryPage({
  client,
  responseGroups,
  page,
  limit,
}: {
  client: Client;
  page: number;
  limit: number;
  responseGroups: (
    | "media"
    | "product_attrs"
    | "product_desc"
    | "relationships"
    | "series"
    | "customer_rights"
  )[];
}) {
  const query = new URLSearchParams({
    response_groups: responseGroups.join(","),
    page: String(page),
    num_results: String(limit),
  });
  const res = await client.fetch(
    new URL(`https://api.audible.${client.getTLD()}/1.0/library?${query}`),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Charset": "utf-8",
        "Content-Type": "application/json",
      },
    }
  );

  // console.log("res", res);

  await assertResponseStatus(res);

  const data: { items: LibraryItem[] } = await res.json();

  // console.log ("res data", data);

  return data.items;
}

export function parseTitle(title: string | null): string {
  if (title === null) {
    throw new Error("No title found");
  }

  return title;
}

// Get the highest resolution image URL from the product images
export function parseImageUrl(productImages: Record<string, string>): string {
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
}

export function parseCreators(authors: Author[]): string[] {
  if (authors.length === 0) {
    throw new Error("No authors found");
  }

  return authors.map((author) => author.name);
}

export function parseIsSourceAvailable({
  publication_datetime: publicationDatetime,
  customer_rights: customerRights,
}: Pick<LibraryItem, "publication_datetime" | "customer_rights">): boolean {
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
}

export type DownloadSourceMetadata =
  | { fileType: "aaxc" }
  | { fileType: "aax"; codec: string; codecName: string };

enum Codec {
  HIGH = "AAX_44_128",
  NORMAL = "AAX_44_64",
}

export function parseDownloadMetadata(
  {
    is_ayce: isAyce,
    available_codecs: availableCodecs,
  }: Pick<LibraryItem, "is_ayce" | "available_codecs">,
  targetQuality: "best" | "high" | "normal"
): DownloadSourceMetadata {
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
}
