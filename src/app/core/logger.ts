import { environment } from '../../environments/environment';

export type LogFunction = (message?: any, ...optionalParams: any[]) => void;
export enum LogLevel { noLog = 0, log = 1, debug = 2 };

///////////////
// Log Class //
///////////////

class Logger {
  logFunction: LogFunction;
  production: boolean;

  logSettings: {[module: string]: LogLevel} = { 
    "*": LogLevel.debug
  }

  constructor() {
    this.production = environment.production || false;
    this.logFunction = (this.production) ? () => {} : console.log;
  }

  public setLogFunction(F: any) { 
    console.log(">>>>>>>>> changing logfunction to: " + F.name + " <<<<<<<<<<");
    this.logFunction = F;
  }

  // Allow to add LogLevels per module at runtime
  public setLogLevel(type: string, level: LogLevel) {
    this.logSettings[type] = level;
  }

  // General function, everythings passes here
  private logger(type: string, message?: any, ...optionalParams: any[]) {
    // convert the optionalParams, so that browsers don't mess up (they tend to keep the objects "alive")
    if (optionalParams && optionalParams.length)
      this.logFunction("[" + type + "]: " + ((typeof message === "string") ? message : JSON.stringify(message)), ...(optionalParams.map(p => JSON.parse(JSON.stringify(p)))))
    else
      this.logFunction("[" + type + "]: " + ((typeof message === "string") ? message : JSON.stringify(message)))
  }

  public err(type: string, message: any, ...optionalParams: any[]) {
    // always log (unless production)
    this.logger(type, message, ...optionalParams);
  }

  public log(type: string, message: any, ...optionalParams: any[]) {
    const level = (this.logSettings)[type] ?? this.logSettings["*"];
    if (level >= LogLevel.log) {
      this.logger(type, message, ...optionalParams);
    }
  }

  public debug(type: string, message: any, ...optionalParams: any[]) {
    const level = (this.logSettings)[type] ?? this.logSettings["*"];
    if (level >= LogLevel.debug) {
      this.logger(type, message, ...optionalParams);
    }
  }
}

export default new Logger();