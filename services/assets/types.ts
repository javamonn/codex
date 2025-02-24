import type {
  AudibleAssetService,
  AudibleAsset,
} from "@/services/assets/audible";

export type AssetServiceId = "audible";

export type AssetServices = {
  audible: typeof AudibleAssetService;
};

export type Assets = {
  audible: AudibleAsset;
};

export type AssetService<T extends AssetServiceId> = AssetServices[T];
export type AssetServiceInstance<T extends AssetServiceId> = InstanceType<
  AssetService<T>
>;

export type Asset<T extends AssetServiceId> = Assets[T];
