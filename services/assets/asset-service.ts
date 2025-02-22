import type { EventEmitter } from "eventemitter3";
import type { AudioSource } from "expo-audio";

declare class AssetService<
  Asset = any,
  InstanceParams = any,
  EventTypes extends EventEmitter.ValidEventTypes = string | symbol
> {
  // Construct the service with instance params
  constructor(params: InstanceParams);

  // Construct the service with serialized params
  constructor(params: string);

  // Get the EventEmitter instance for the service
  getEmitter(): Omit<EventEmitter<EventTypes>, "emit">;

  // Get assets from the service.
  getAssets(params: { page: number; limit: number }): Promise<Asset[]>;

  // Get a single asset from the service.
  getAsset(params: { id: string }): Promise<Asset | null>;

  // Get the playback source for an asset.
  getAssetPlaybackSource(params: { asset: Asset }): Promise<AudioSource>;
}

export type AssetServiceInterface<
  Asset,
  InstanceParams = any,
  EventTypes extends EventEmitter.ValidEventTypes = any
> = typeof AssetService<Asset, InstanceParams, EventTypes>;
