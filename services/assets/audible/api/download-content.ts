import { assertResponseStatus } from "@/utils/assert-response-status";

import type { Client } from "./client";

export const getAAXSourceUrl = async ({
  client,
  asin,
  codec,
}: {
  client: Client;
  asin: string;
  // see source-codec-metadata for resolution
  codec: string;
}): Promise<URL> => {
  const query = new URLSearchParams({
    type: "AUDI",
    currentTransportMethod: "WIFI",
    key: asin,
    codec: codec,
  });

  const res = await client.fetch(
    new URL(
      `https://cde-ta-g7g.amazon.com/FionaCDEServiceEngine/FSDownloadContent?${query}`
    ),
    {
      method: "HEAD",
    }
  );

  await assertResponseStatus(res);

  return new URL(
    res.url.replace("cds.audible.com", `cds.audible.${client.getTLD()}`)
  );
};
