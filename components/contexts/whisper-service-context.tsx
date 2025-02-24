import { createContext, useContext, useMemo } from "react";

import { WhisperService } from "@/services/whisper";

type ContextData = {
  whisper: WhisperService;
};

const globalWhisper = new WhisperService();

const Context = createContext<ContextData>({
  whisper: globalWhisper,
});

export const WhisperServiceProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const contextData: ContextData = useMemo(
    () => ({
      whisper: globalWhisper,
    }),
    []
  );

  return <Context.Provider value={contextData}>{children}</Context.Provider>;
};

export const useWhisperServiceContext = () => {
  return useContext(Context);
};
