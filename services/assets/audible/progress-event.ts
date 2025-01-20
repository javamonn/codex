export class ProgressEvent {
  public type: string;
  public loaded?: number;
  public total?: number;
  public lengthComputable?: boolean;

  constructor(
    type: string,
    opts?: { loaded?: number; total?: number; lengthComputable?: boolean }
  ) {
    this.type = type;
    if (opts) {
      this.loaded = opts.loaded;
      this.total = opts.total;
      this.lengthComputable = opts.lengthComputable;
    }
  }
}
