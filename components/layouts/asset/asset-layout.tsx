import { useEffect } from "react";

import { useQuery as useAssetQuery } from "@/rq/asset/query";
import { AssetServiceId } from "@/rq/asset-services/types";

import { useTranscriberServiceContext } from "@/components/contexts/TranscriberContext";
import { AssetAudioPlayer } from "@/components/containers/asset-audio-player";

import { AssetErrorLayout } from "./asset-error-layout";
import { AssetLoadingLayout } from "./asset-loading-layout";

export const AssetLayout: React.FC<{
  assetId: string;
  assetType: AssetServiceId;
}> = ({ assetType, assetId }) => {
  const {
    data: asset,
    isLoading,
    isError,
  } = useAssetQuery({ assetType, assetId });
  const { transcriber } = useTranscriberServiceContext();

  // Initialize the transcriber service asap
  useEffect(() => {
    transcriber.initialize();
    return () => {
      transcriber.release();
    };
  }, []);

  if (isLoading) {
    <AssetLoadingLayout />;
  }

  if (isError || !asset) {
    return <AssetErrorLayout />;
  }

  return <AssetAudioPlayer asset={asset} />;
};
