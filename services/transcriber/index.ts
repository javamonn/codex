import { WhisperService } from "../whisper";

// TODO: onProgress callback to emit results via whisper new segments callback
export const getAudioSourceText = ({
  id,
  audioSource,
  chunkStartSeconds,
  chunkEndSeconds,
  whisper,
}: {
  // Stable identifier for the source
  id: string;
  // The M4B audio source
  audioSource: { uri: string };
  // The start time in seconds of the audio source to transcribe
  chunkStartSeconds: number;
  // The end time in seconds of the audio source to transcribe
  chunkEndSeconds: number;
  // The whisper service to use for the transcription
  whisper: WhisperService;
}): Promise<string> => {
  // TODO: return output file cache for id-chunkStartSeconds-chunkEndSeconds exists
  // TODO: get or create converted wav chunk for id-chunkStartSeconds-chunkEndSeconds 
  // TODO: transcribe wav chunk
  // TODO: write transcribed text to output file cache for id-chunkStartSeconds-chunkEndSeconds
  // TODO: return transcribed text
  throw new Error("Not implemented");
};
