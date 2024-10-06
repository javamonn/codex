import type { EventEmitter } from "eventemitter3";

declare class AssetService<
  InstanceParams = any,
  EventTypes extends EventEmitter.ValidEventTypes = string | symbol
> {
  // Construct the service with params or the output of getSerializedParams
  constructor(params: InstanceParams | string);

  // Serialize the instance params to a string for persistence
  getSerializedParams(): string;

  getEmitter(): Omit<EventEmitter<EventTypes>, "emit">;
}

export type AssetServiceInterface<
  InstanceParams,
  EventTypes extends EventEmitter.ValidEventTypes
> = typeof AssetService<InstanceParams, EventTypes>;
