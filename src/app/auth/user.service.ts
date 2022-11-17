import { Injectable } from "@angular/core";
import { CognitoAccessToken, CognitoIdToken, CognitoRefreshToken } from "amazon-cognito-identity-js";
import * as EventEmitter from "events";
import { kEmptyUser, settings, User } from "./types";

export enum BlueEvent {kLoggedIn = "login", kLoggedOut = "logout"};

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user: User;

  private idToken: CognitoIdToken;
  private accessToken: CognitoAccessToken;
  private refreshToken: CognitoRefreshToken
  
  constructor() {
    this.getUser();
    this.fetchTokens();

    console.log("UserService.constructor -> user/tokens: ", this.user);

    this.setupEmitter();
    this.signal(BlueEvent.kLoggedIn);  // ??
  }


  public getIdToken(): CognitoIdToken {
    if (!this.idToken) this.fetchTokens();
    return this.idToken;
  }
  public getAccessToken(): CognitoAccessToken {
    if (!this.accessToken) this.fetchTokens();
    return this.accessToken;
  }
  public getRefreshToken(): CognitoRefreshToken {
    if (!this.refreshToken) this.fetchTokens();
    return this.refreshToken;
  }

  public logout() {
    console.log("UserService.logout");
    this.storeTokens(null, null, null);
  }

  public isLoggedIn(): boolean {
    return !! this.idToken;
  }

  public storeTokens(idToken: CognitoIdToken, accessToken: CognitoAccessToken, refreshToken: CognitoRefreshToken) {
    this.idToken = idToken;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    localStorage.setItem("BLUE.IDTOKEN", this.idToken?.getJwtToken() || "");
    localStorage.setItem("BLUE.ACCESSTOKEN", this.accessToken?.getJwtToken() || "");
    localStorage.setItem("BLUE.REFRESHTOKEN", this.refreshToken?.getToken() || "");
  }

  public fetchTokens() {
    this.idToken = new CognitoIdToken({IdToken: localStorage.getItem("BLUE.IDTOKEN")});
    this.accessToken = new CognitoAccessToken({AccessToken: localStorage.getItem("BLUE.ACCESSTOKEN")});
    this.refreshToken = new CognitoRefreshToken({RefreshToken: localStorage.getItem("BLUE.REFRESHTOKEN")});
  }

  public getUser(): User {
    try {
      if (!this.user) {
        this.user = JSON.parse(localStorage.getItem("BLUE.USER"));
      }
      return this.user;
      
    } catch(err) {
      return null;
    }
  }

  public setUser(user: Partial<User>) {
    if (user) {
      this.user = {...kEmptyUser, ...user};
      this.user.settings = settings(this.user);
      console.log("UserService.setUser -> user: ", user);

      localStorage.setItem("BLUE.USER", JSON.stringify(this.user));
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