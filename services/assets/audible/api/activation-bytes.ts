import { assertResponseStatus } from "@/utils/assert-response-status";

import { Client } from "./client";

export async function getActivationBytes({
  client,
}: {
  client: Client;
}): Promise<string> {
  const query = new URLSearchParams({
    player_manuf: "Audible,iPhone",
    action: "register",
    player_model: "iPhone",
  });
  const res = await client.fetch(
    new URL(`https://www.audible.com/license/token?${query}`),
    { method: "GET" }
  );

  await assertResponseStatus(res);

  const data = await res.arrayBuffer();
  const blob = new Uint8Array(data);

  return parseActivationBytes(blob);
}

function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);

  // Copy each array into the result
  let offset = 0;
  arrays.forEach((array) => {
    result.set(array, offset);
    offset += array.length;
  });

  return result;
}

// Byte sequences used for activation byte validation
const BAD_LOGIN = [66, 65, 68, 95, 76, 79, 71, 73, 78]; // "BAD_LOGIN"
const WHOOPS = [87, 104, 111, 111, 112, 115]; // "Whoops"
const GROUP_ID = [103, 114, 111, 117, 112, 95, 105, 100]; // "group_id"

function assertDataValid(data: Uint8Array): void {
  // Helper function to check if byte sequence exists in data
  const findBytes = (haystack: Uint8Array, needle: number[]) => {
    search: for (let i = 0; i <= haystack.length - needle.length; i++) {
      for (let j = 0; j < needle.length; j++) {
        if (haystack[i + j] !== needle[j]) continue search;
      }
      return true;
    }
    return false;
  };

  // Check for error conditions
  if (findBytes(data, BAD_LOGIN) || findBytes(data, WHOOPS)) {
    throw new Error("activation bytes contains error sentinel");
  }

  if (!findBytes(data, GROUP_ID)) {
    throw new Error("activation bytes missing group_id");
  }
}

function parseActivationBytes(data: Uint8Array): string {
  assertDataValid(data);

  // Extract last 0x238 bytes
  const activationData = data.slice(-0x238);

  // Implement the equivalent of struct.unpack("70s1x" * 8)
  // This creates 8 chunks of 71 bytes each (70 bytes + 1 padding byte)
  const chunks = [];
  for (let i = 0; i < 8; i++) {
    const start = i * 71;
    const chunk = activationData.slice(start, start + 70);
    chunks.push(chunk);
  }

  // Join the chunks
  const joinedData = concatenateUint8Arrays(chunks.flat());

  // Extract first 4 bytes and convert to little-endian 32-bit integer
  const firstFourBytes = joinedData.slice(0, 4);
  const value = new DataView(firstFourBytes.buffer).getUint32(0, true);

  // Convert to hex string
  let ab = value.toString(16);

  // Pad with leading zeros if necessary
  if (ab.length < 8) {
    ab = ab.padStart(8, "0");
  }

  return ab;
}
