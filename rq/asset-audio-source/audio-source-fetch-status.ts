import { useState } from "react";

import {
  ProgressEvent,
  ProgressEventHandler,
} from "@/services/assets/progress-event";

export type AudioSourceFetchStatus =
  | { status: "idle" }
  | { status: "downloading"; progress: number | undefined }
  | { status: "processing"; progress: number | undefined };

const parseProgressEvent = (
  ev: ProgressEvent
): AudioSourceFetchStatus | undefined => {
  switch (ev.type) {
    case "download-progress":
      return {
        status: "downloading",
        progress: ev.loaded && ev.total ? ev.loaded / ev.total : undefined,
      };
    case "conversion-progress":
      return {
        status: "processing",
        progress: ev.loaded && ev.total ? ev.loaded / ev.total : undefined,
      };
  }
};

export const useAudioSourceFetchStatus = (): {
  audioSourceFetchStatus: AudioSourceFetchStatus;
  onProgress: ProgressEventHandler;
} => {
  const [audioSourceFetchStatus, setAudioSourceFetchStatus] =
    useState<AudioSourceFetchStatus>({ status: "idle" });

  const onProgress: ProgressEventHandler = (ev) => {
    const parsed = parseProgressEvent(ev);
    if (parsed) {
      setAudioSourceFetchStatus(parsed);
    }
  };

  return { audioSourceFetchStatus, onProgress };
};
