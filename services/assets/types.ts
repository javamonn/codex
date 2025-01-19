import type { EventEmitter } from "eventemitter3";
import type { AudioSource } from "expo-audio";

// Base asset class. Playback source resolution will be service-specific.
export abstract class Asset {
  readonly id: string;
  readonly imageUrl: string;
  readonly title: string;
  readonly creators: string[];

  constructor({
    id,
    imageUrl,
    title,
    creators,
  }: {
    imageUrl: string;
    title: string;
    creators: string[];
    id: string;
  }) {
    this.imageUrl = imageUrl;
    this.title = title;
    this.creators = creators;
    this.id = id;
  }

  abstract getPlaybackSource(p: {
    onProgress: (ev: ProgressEvent) => void;
  }): Promise<AudioSource>;
}

declare class AssetService<
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
}

export type AssetServiceInterface<
  InstanceParams,
  EventTypes extends EventEmitter.ValidEventTypes
> = typeof AssetService<InstanceParams, EventTypes>;
