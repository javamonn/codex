import { useEffect } from "react";
import { AssetId } from "@/services/assets/types";

import { useQuery } from "./query";
import { useTranscriberServiceContext } from "@/components/contexts/TranscriberContext";
import { AssetAudioPlayer } from "@/components/containers/asset-audio-player";

import { AssetErrorLayout } from "./asset-error-layout";
import { AssetLoadingLayout } from "./asset-loading-layout";

export const AssetLayout: React.FC<{ id: AssetId }> = ({ id }) => {
  const { data: asset, isLoading, isError } = useQuery(id);
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
