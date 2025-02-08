import { createContext, useContext, useMemo } from "react";

import { TranscriberService } from "@/services/transcriber";

type ContextData = {
  transcriber: TranscriberService;
};

const globalTranscriber = new TranscriberService();

const Context = createContext<ContextData>({
  transcriber: globalTranscriber,
});

export const TranscriberServiceProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const contextData: ContextData = useMemo(
    () => ({
      transcriber: globalTranscriber,
    }),
    []
  );

  return <Context.Provider value={contextData}>{children}</Context.Provider>;
};

export const useTranscriberServiceContext = () => {
  return useContext(Context);
};
