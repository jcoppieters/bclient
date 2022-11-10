import { Injectable } from "@angular/core";
import * as EventEmitter from "events";
import { kEmptyUser, settings, User } from "./types";

export enum BlueEvent {kLoggedIn = "login", kLoggedOut = "logout"};

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private token: string;
  private expiresIn: number;
  private user: User;
  public small: boolean = true;
  
  constructor() {
    this.getPermanent();
    console.log("UserService.constructor -> user: ", this.user);
    this.small = localStorage.getItem("SMALL") != "N";

    this.setupEmitter();
    this.signal(BlueEvent.kLoggedIn);
  }

  toggleSmall() {
    this.small = ! this.small;
    localStorage.setItem("SMALL", this.small ? "Y" : "N");
  }

  public getUser(): User {
    if (!this.user) {
      this.getPermanent();
    }
    return this.user;
  }
  public getToken(): string {
    return this.token;
  }

  public logout() {
    console.log("UserService.logout");
    this.setPermanent("", 0, this.user); // leave email intact
  }
  public isLoggedIn(): boolean {
    return !! this.token;
  }

  private getPermanent() {
    try {
      this.user = JSON.parse(localStorage.getItem("USER"));
    } catch(e) {
      localStorage.setItem("USER", "");
    }

    this.user = this.user || {...kEmptyUser};
    this.user.settings = settings(this.user);


    this.token = localStorage.getItem("ACCESS_TOKEN");
    this.expiresIn = parseInt(localStorage.getItem("EXPIRES_IN"));

    console.log("UserService.getPermanent -> user: " + this.user?.id + ", token: …" + this.token?.slice(-20))
  }


  public setPermanent(accessToken: string, expiresIn: number | string, user?: User) {
    // console.log("UserService.setPermanent -> token: …" + accessToken?.slice(-20) + ", expires: " + expiresIn);

    if (user) {
      this.user = user || {...kEmptyUser};
      this.user.settings = settings(this.user);
      console.log("UserService.setPermanent -> user: ", user);

      localStorage.setItem("USER", JSON.stringify(this.user));
      this.signal(BlueEvent.kLoggedIn, this.user)
    }

    if (typeof accessToken != "undefined") {
      this.token = accessToken;
      console.log("UserService.setPermanent -> token: …" + accessToken?.slice(-20) + ", expires: " + expiresIn);

      localStorage.setItem("ACCESS_TOKEN", this.token);
      if (accessToken === "") {
        // log out
        this.signal(BlueEvent.kLoggedOut, this.user)
      }
    }

    if (typeof expiresIn != "undefined") {
      if (typeof expiresIn === "string")
        expiresIn = parseInt(expiresIn);

      this.expiresIn = expiresIn;
      localStorage.setItem("EXPIRES_IN", this.expiresIn.toString());
    }
  }

  /////////////////////////
  // Global event system //
  /////////////////////////
  private emitter: EventEmitter;

  setupEmitter() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(10);
  }

  // keep updated about changes
  on(action: BlueEvent, listener: (...args: any[]) => void) {
    this.emitter.on(action, listener);
  }
  off(action: BlueEvent, listener: (...args: any[]) => void) {
    this.emitter.off(action, listener);
  }

  signal(action: BlueEvent, data?) {
    console.log("UserService.signal -> ***" + action + "***");
    this.emitter.emit(action, data);
  }

}