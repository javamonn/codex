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
