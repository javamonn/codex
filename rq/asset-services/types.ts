import type { AudibleAssetService } from "@/services/assets/audible";

export type AssetServices = {
  audible: InstanceType<typeof AudibleAssetService> | null;
};

export type AssetServiceId = keyof AssetServices;
export type AssetService<T extends AssetServiceId> = NonNullable<
  AssetServices[T]
>;
