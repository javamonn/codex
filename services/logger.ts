type FormattedLog = {
  level: "info" | "error" | "warn" | "debug";
  service: string;
  message: string;
  data?: Object;
};

export function log({ level, message, data, service }: FormattedLog) {
  if (level === "error" && data && "error" in data) {
    console.error(data.error);
    delete data.error;
  }

  console.log({
    level,
    message,
    service,
    data: data ? JSON.stringify(data) : undefined,
    ts: new Date().toISOString(),
  });

  // TODO: append to log file in production
  // TODO: send errors to sentry
}
