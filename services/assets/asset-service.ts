import type { EventEmitter } from "eventemitter3";
import type { ProgressEvent } from "./progress-event";

export abstract class AssetService<
  Asset = any,
  EventTypes extends EventEmitter.ValidEventTypes = string | symbol
> {
  // Get the EventEmitter instance for the service
  abstract getEmitter(): Omit<EventEmitter<EventTypes>, "emit">;

  // Get assets from the service.
  abstract getAssets(params: { page: number; limit: number }): Promise<Asset[]>;

  // Get a single asset from the service.
  abstract getAsset(params: { id: string }): Promise<Asset | null>;

  // Get the audio source for an asset.
  abstract getAssetAudioSource(params: {
    asset: Asset;
    abortSignal: AbortSignal;
    onProgress: (ev: ProgressEvent) => void;
  }): Promise<{ uri: string }>;
}
