// Matches python .encode() behavior
export function encodeHex(input: string): string {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) > 127) {
      throw new Error("Invalid character in input");
    }
    output += input.charCodeAt(i).toString(16);
  }
  return output;
}

