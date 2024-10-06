type FormattedLog = {
  level: "info" | "error" | "warn" | "debug";
  service: string;
  message: string;
  data?: Object;
};

function log({ level, message, data, service }: FormattedLog) {
  console.log({
    level,
    message,
    service,
    data: data ? JSON.stringify(data) : undefined,
    ts: new Date().toISOString(),
  });

  // TODO: append to log file in production
}

export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  public info(message: string, data?: Object) {
    log({ level: "info", message, data, service: this.serviceName });
  }

  public error(message: string, error: Error) {
    // TODO: send errors to sentry
    log({
      level: "error",
      message: message,
      data: { message: error.message, stack: error.stack },
      service: this.serviceName,
    });
  }

  public warn(message: string, data?: Object) {
    log({ level: "warn", message, data, service: this.serviceName });
  }

  public debug(message: string, data?: Object) {
    log({ level: "debug", message, data, service: this.serviceName });
  }
}
