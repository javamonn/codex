import { Href, useLocalSearchParams } from "expo-router";

import { AssetLayout } from "@/components/layouts/asset/asset-layout";
import { AssetServiceId } from "@/rq/asset-services/types";

export type ScreenParams = {
  assetId: string;
  assetType: AssetServiceId;
};

export const makeHref = ({ assetId, assetType }: ScreenParams): Href =>
  `/asset/${assetType}/${assetId}`;

export default function AssetScreen() {
  const { assetId, assetType } = useLocalSearchParams<ScreenParams>();

  return <AssetLayout assetId={assetId} assetType={assetType} />;
}
