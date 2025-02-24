import type { AudibleAsset } from "@/services/assets/audible";

export type UnionAsset = AudibleAsset;

export interface UnionAssetService {
  getAssets(params: { page: number; limit: number }): Promise<UnionAsset[]>;
  getAsset(params: { id: string }): Promise<UnionAsset | null>;
}
