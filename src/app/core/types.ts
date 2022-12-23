export type Id = number;
export type Char = string;
export enum YN { kNo = "N", kYes = "Y" };
export type Timer = ReturnType<typeof setTimeout>;

export class ServerError extends Error {
  status: number;
  statusText: string;
  constructor(message: string, status: number) {
    super(message);
    this.statusText = message;
    this.status = status;
  }
}

export enum ServerStatus { kOK = "OK", kNOK = "NOK", kError = "ERROR"}

export interface ServerResponse {
  status: ServerStatus;
  message?: string;
  code?: number;
  [key: string]: unknown;
}


export function makeNOKResponse(message: string, code: number, extras?: object): ServerResponse {
  return {status: ServerStatus.kNOK, message, code, ...extras};
}

export function two(i: number | string): string {
  return ((i < 10) ? "0" : "") + i;
}
export function three(i: number | string): string {
  return ((i < 10) ? "00" : ((i < 100) ? "0" : "")) + i;
}
export function four(i: number | string): string {
  return ((i < 10) ? "000" : ((i < 100) ? "00" : ((i < 10) ? "0" : ""))) + i;
}

export function MMYYYY(d: Date): string {
  if ((d instanceof Date) && (d.getTime() > 0))
    return two(d.getMonth()+1) + "-" + d.getFullYear();
  else
    return ""
}