import { assertResponseStatus } from "@/utils";

import { TLD } from "./constants";

const BASE_REQUEST_HEADERS = {
  Accept: "application/json",
  "Accept-Charset": "utf-8",
  "Content-Type": "application/json",
};

function getHeaders(authHeaders: Headers): Headers {
  Object.entries(BASE_REQUEST_HEADERS).forEach(([key, value]) => {
    authHeaders.set(key, value);
  });

  return authHeaders;
}

export async function getLibraryPage({
  authHeaders,
  tld,
}: {
  authHeaders: Headers;
  tld: TLD;
}) {
  const query = new URLSearchParams({
    response_groups: "product_attrs",
    page: "1",
    num_results: "100",
  });
  const headers = getHeaders(authHeaders);
  console.log("headers", headers);
  const res = await fetch(`https://api.audible.${tld}/1.0/library?${query}`, {
    method: "GET",
    headers,
  });

  await assertResponseStatus(res);

  return res.json();
}
