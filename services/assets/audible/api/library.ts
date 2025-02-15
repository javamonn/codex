import { assertResponseStatus } from "@/utils";

import type { LibraryItem } from "./library-item";
import type { Client } from "./client";

type ResponseGroup =
  | "contributors"
  | "media"
  | "price"
  | "product_attrs"
  | "product_desc"
  | "product_details"
  | "product_extended_attrs"
  | "product_plan_details"
  | "product_plans"
  | "rating"
  | "sample"
  | "sku"
  | "series"
  | "reviews"
  | "ws4v"
  | "origin"
  | "relationships"
  | "review_attrs"
  | "categories"
  | "badge_types"
  | "category_ladders"
  | "claim_code_url"
  | "is_downloaded"
  | "is_finished"
  | "is_returnable"
  | "origin_asin"
  | "pdf_url"
  | "percent_complete"
  | "periodicals"
  | "provided_review"
  | "customer_rights";

export async function getLibaryItem({
  client,
  responseGroups,
  asin,
}: {
  client: Client;
  responseGroups: ResponseGroup[];
  asin: string;
}) {
  throw new Error("Not implemented");
}

export async function getLibraryPage({
  client,
  responseGroups,
  page,
  limit,
}: {
  client: Client;
  page: number;
  limit: number;
  responseGroups: ResponseGroup[];
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

  await assertResponseStatus(res);

  const data: { items: LibraryItem[] } = await res.json();

  return data.items;
}

