export enum CountryCode {
  US = "us",
  CA = "ca",
  UK = "uk",
  AU = "au",
  FR = "fr",
  DE = "de",
  JP = "jp",
  IT = "it",
  IN = "in",
  ES = "es",
  BR = "br",
}

export enum TLD {
  US = "com",
  CA = "ca",
  UK = "co.uk",
  AU = "com.au",
  FR = "fr",
  DE = "de",
  JP = "co.jp",
  IT = "it",
  IN = "co.in",
  ES = "es",
  BR = "com.br",
}

export const Locale: Record<CountryCode, { tld: TLD; marketPlaceId: string }> =
  {
    [CountryCode.US]: { tld: TLD.US, marketPlaceId: "AF2M0KC94RCEA" },
    [CountryCode.CA]: { tld: TLD.CA, marketPlaceId: "A2CQZ5RBY40XE" },
    [CountryCode.UK]: { tld: TLD.UK, marketPlaceId: "A2I9A3Q2GNFNGQ" },
    [CountryCode.AU]: { tld: TLD.AU, marketPlaceId: "AN7EY7DTAW63G" },
    [CountryCode.FR]: { tld: TLD.FR, marketPlaceId: "A2728XDNODOQ8T" },
    [CountryCode.DE]: { tld: TLD.DE, marketPlaceId: "AN7V1F1VY261K" },
    [CountryCode.JP]: { tld: TLD.JP, marketPlaceId: "A1QAP3MOU4173J" },
    [CountryCode.IT]: { tld: TLD.IT, marketPlaceId: "A2N7FU2W2BU2ZC" },
    [CountryCode.IN]: { tld: TLD.IN, marketPlaceId: "AJO3FBRUE6J4S" },
    [CountryCode.ES]: { tld: TLD.ES, marketPlaceId: "ALMIKO4SZCSAR" },
    [CountryCode.BR]: { tld: TLD.BR, marketPlaceId: "A10J1VAYUDTYRN" },
  } as const;

export const DEVICE_REGISTRATION_DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  "Accept-Language": "en-US",
  "Accept-Encoding": "gzip",
};

export const CLIENT_ID_SUFFIX: string = "#A2CZJZGLK2JJVM";
