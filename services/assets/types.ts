import type { EventEmitter } from "eventemitter3";

export type Asset = unknown;

declare class AssetService<
  InstanceParams = any,
  EventTypes extends EventEmitter.ValidEventTypes = string | symbol
> {
  // Construct the service with params or the output of getSerializedParams
  constructor(params: InstanceParams | string);

  // Serialize the instance params to a string for persistence
  getSerializedParams(): string;

  // Get the EventEmitter instance for the service
  getEmitter(): Omit<EventEmitter<EventTypes>, "emit">;

  // Get assets from the service.
  getAssets(): Promise<Asset[]>
}

export type AssetServiceInterface<
  InstanceParams,
  EventTypes extends EventEmitter.ValidEventTypes
> = typeof AssetService<InstanceParams, EventTypes>;
