import type { EventEmitter } from "eventemitter3";
import { AVPlaybackSource } from "expo-av";

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

  abstract getPlaybackSource(): Promise<AVPlaybackSource>;
}

export type GetAsssetParams = {
  page: number;
  limit: number;
};

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
  getAssets(params: GetAsssetParams): Promise<Asset[]>;
}

export type AssetServiceInterface<
  InstanceParams,
  EventTypes extends EventEmitter.ValidEventTypes
> = typeof AssetService<InstanceParams, EventTypes>;
