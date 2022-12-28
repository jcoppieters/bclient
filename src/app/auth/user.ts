import { CognitoAccessToken, CognitoIdToken, CognitoRefreshToken } from "amazon-cognito-identity-js";
import * as EventEmitter from "events";
import { kEmptyUser, settings, UserData } from "./types";
import { environment } from '../../environments/environment';
import logger from "../core/logger";

export enum UserEvent {kLoggedIn = "login", kLoggedOut = "logout"};


export class User {

  private user: UserData = null;

  private idToken: CognitoIdToken = null;
  private accessToken: CognitoAccessToken = null;
  private refreshToken: CognitoRefreshToken = null;
  
  constructor() {
    logger.log("user", "User.constructor -> start");

    this.setupEmitter();

    this.getUserData();
    this.fetchTokens();

    logger.log("user", "User.constructor -> user/tokens: ", this.user);
  }


  public getIdToken(): CognitoIdToken {
    if (!this.idToken) this.fetchTokens();
    return this.idToken;
  }
  public getAccessToken(): CognitoAccessToken {
    //if (!this.accessToken)
     this.fetchTokens();
    return this.accessToken;
  }
  public getRefreshToken(): CognitoRefreshToken {
    if (!this.refreshToken) this.fetchTokens();
    return this.refreshToken;
  }

  public logout() {
    logger.log("user", "User.logout");
    this.storeTokens(null, null, null);
    this.signal(UserEvent.kLoggedOut);
  }

  public login(idToken: CognitoIdToken, accessToken: CognitoAccessToken, refreshToken: CognitoRefreshToken) {
    logger.log("user", "User.login");
    this.storeTokens(idToken, accessToken, refreshToken);
    this.signal(UserEvent.kLoggedIn);
  }

  public isLoggedIn(): boolean {
    return !! this.idToken;
  }

  public storeTokens(idToken: CognitoIdToken, accessToken: CognitoAccessToken, refreshToken: CognitoRefreshToken) {
    this.idToken = idToken;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    // Store in local storage, etiher the JWT token or "" (if tokens are null)
    localStorage.setItem(environment.name + ".IDTOKEN", this.idToken?.getJwtToken() || "");
    localStorage.setItem(environment.name + ".ACCESSTOKEN", this.accessToken?.getJwtToken() || "");
    localStorage.setItem(environment.name + ".REFRESHTOKEN", this.refreshToken?.getToken() || "");
  }

  public fetchTokens() {
    const IdToken = localStorage.getItem(environment.name + ".IDTOKEN");
    if (IdToken) this.idToken = new CognitoIdToken({IdToken});

    const AccessToken = localStorage.getItem(environment.name + ".ACCESSTOKEN");
    if (AccessToken) this.accessToken = new CognitoAccessToken({AccessToken});

    const RefreshToken = localStorage.getItem(environment.name + ".REFRESHTOKEN");
    if (RefreshToken) this.refreshToken = new CognitoRefreshToken({RefreshToken});
  }

  public getUserData(): UserData {
    try {
      if (!this.user) {
        this.user = JSON.parse(localStorage.getItem(environment.name + ".USER"));
      }
      return this.user;
      
    } catch(err) {
      return null;
    }
  }

  public setUserData(user: Partial<UserData>) {
    if (user) {
      this.user = {...kEmptyUser, ...user};
      this.user.settings = settings(this.user);
      console.log("User.setUser -> user: ", user);

      localStorage.setItem(environment.name + ".USER", JSON.stringify(this.user));
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
  on(action: UserEvent, listener: (...args: any[]) => void) {
    logger.log("user", "adding listener");
    this.emitter.on(action, listener);
  }
  off(action: UserEvent, listener: (...args: any[]) => void) {
    this.emitter.off(action, listener);
  }

  signal(action: UserEvent, data?) {
    logger.log("user", "User.signal -> ***" + action + "***");
    this.emitter.emit(action, data);
  }

}

export default new User();