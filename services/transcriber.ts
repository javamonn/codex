import {
  initWhisper,
  WhisperContext,
  TranscribeFileOptions,
  TranscribeResult,
} from "whisper.rn";

const model = require("../assets/whisper/ggml-base.en-q8_0.bin");

export class TranscriberService {
  private whisper: Promise<WhisperContext> | null;

  constructor() {
    this.whisper = null;
  }

  public initialize(): Promise<WhisperContext> {
    if (!this.whisper) {
      this.whisper = initWhisper({
        filePath: model,
      });
    }

    return this.whisper;
  }

  public async exec({
    uri,
    abortSignal,
    transcribeOptions,
  }: {
    uri: string;
    abortSignal: AbortSignal;
    transcribeOptions: TranscribeFileOptions;
  }): Promise<TranscribeResult> {
    return this.initialize().then((whisper) => {
      const { stop, promise } = whisper.transcribe(uri, transcribeOptions);
      abortSignal.addEventListener("abort", () => {
        stop();
      });

      return promise;
    });
  }

  public async release(): Promise<void> {
    if (this.whisper) {
      const ctx = await this.whisper;
      ctx.release();
      this.whisper = null;
    }
  }
}
