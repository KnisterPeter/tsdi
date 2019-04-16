export enum Level {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
  none = 'none'
}
const LevelMap = {
  [Level.debug]: 0,
  [Level.info]: 1,
  [Level.warn]: 2,
  [Level.error]: 3,
  [Level.none]: 4
};

export function getLevelNames(): string[] {
  return Object.keys(Level);
}

export class Logger {
  constructor(private readonly level: Level) {}

  public log(message: string, error: Error | undefined, level: Level): void {
    if (LevelMap[this.level] <= LevelMap[level]) {
      const fn = level === Level.error ? console.error : console.log;
      if (error) {
        fn(message, error);
      } else {
        fn(message);
      }
    }
  }

  public debug(message: string, error?: Error): void {
    this.log(message, error, Level.debug);
  }

  public info(message: string, error?: Error): void {
    this.log(message, error, Level.info);
  }

  public warn(message: string, error?: Error): void {
    this.log(message, error, Level.warn);
  }

  public error(message: string, error?: Error): void {
    this.log(message, error, Level.error);
  }
}
