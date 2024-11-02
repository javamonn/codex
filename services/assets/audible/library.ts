import { assertResponseStatus } from "@/utils";

import { DeviceRegistration } from "./device-registration";

export type ContentDeliveryType = "SinglePartBook" | "MultiPartBook";
export type Author = { asin: string; name: string };
export type LibraryItem = {
  asin: string;
  title: string | null;
  content_delivery_type: ContentDeliveryType;
  authors: Author[];

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

  // keyed by resolution
  product_images: Record<string, string>;
};

export async function getLibraryPage({
  deviceRegistration,
  responseGroups,
  page,
  limit,
}: {
  deviceRegistration: DeviceRegistration;
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

  const host = `https://api.audible.${deviceRegistration.getTLD()}`;
  const path = `/1.0/library?${query}`;

  const headers = deviceRegistration.getSignedRequestHeaders({
    method: "GET",
    path: path,
    body: null,
    headers: new Headers({
      Accept: "application/json",
      "Accept-Charset": "utf-8",
      "Content-Type": "application/json",
    }),
  });

  const res = await fetch(`${host}${path}`, {
    method: "GET",
    headers,
  });

  await assertResponseStatus(res);

  const data: { items: LibraryItem[] } = await res.json();

  return data.items
}
