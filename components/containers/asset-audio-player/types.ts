import { AudioSource } from "expo-audio"

export type AudioSourceState =
  | { status: "initial" }
  | { status: "downloading"; progress: number }
  | { status: "processing"; progress: number }
  | { status: "ready"; source: AudioSource };
