// Stores serialized asset services, e.g. auth
export const assetServiceContextServiceKey = (serviceId: string): string =>
  `AssetsServiceContext:${serviceId}`;

// Stores audible activation bytes used for asset playback
export const audibleActivationBytesKey: string = "audible:activationBytes";
