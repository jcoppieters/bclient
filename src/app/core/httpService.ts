import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CognitoIdToken, CognitoUser } from 'amazon-cognito-identity-js';
import { environment } from '../../environments/environment';
import { userPool } from '../auth/auth.service';
import { User } from '../auth/user';
import { ServerResponse, ServerStatus } from './types';

console.log("httpService.ts");

@Injectable({
  providedIn: 'root'
})
export class HttpService  {
  url: string;

  constructor(private httpClient: HttpClient,
              protected user: User) {    
    
    console.log("HttpService.constructor -> using: " + environment.server + ", logged in: " + this.isLoggedIn());
    this.use(environment.server);
  }


  isLoggedIn(): boolean {
    return this.user.isLoggedIn();
  }

  async executor(call: () => Promise<any>): Promise<ServerResponse> {
    try {
      const response = await call();

      // console.log("HttpService.executor (1) -> body: " + JSON.stringify(response.body));
      return response.body;

    } catch(e) {
      console.log("HttpService.onlyBody -> error: " + JSON.stringify(e));

      // authentication failed
      if (e.status === 401) {
        try {
          // try to ask new accessToken and re-execute the call (headers will be reconstructed)
          await this.getNewIdToken();
          const response = await call();

          // console.log("HttpService.executor (2) -> body: " + JSON.stringify(response.body));
          return response.body;

        } catch(e) {
          // if the second call fails -> fail
          
          if (e.status === 401) {
            // either again: authentication failed -> logout in the UX too
            console.log("HttpService.executor (2) -> 401 response -> logout & redirect to login page");
            this.user.logout();
            return {status: ServerStatus.kNOK, message: "Session expired or wrong credentials"};

          } else {
            // normal call failure after second try
            console.log("HttpService.executor (2) -> " + e.statusText + " response -> ", e);
            return { message: e.statusText, code: e.statusText, ...e, status: ServerStatus.kError};
          }
        }

      } else {
        // normal call failure after first try
        console.log("HttpService.executor (1) -> " + e.statusText + " response -> ", e);
        return { message: e.statusText, code: e.statusText, ...e, status: ServerStatus.kError};
      }

    }
  }

  async getNewIdToken(): Promise<CognitoIdToken> {
    const refreshToken = this.user.getRefreshToken();
    const cognitoUser = new CognitoUser({Username: this.user.getUserData()?.email || "", Pool: userPool});

    return new Promise( (resolve, reject) => {
      cognitoUser.refreshSession(refreshToken, (err, session) => {
        if (err) {
          console.log("HttpService.getNewIdToken -> Error: ", err);
          reject(err);
        } else {
          // call "storeTokens", not "login", we don't want to alert the rest of the application
          this.user.storeTokens(session.idToken, session.accessToken, session.refreshToken)
          resolve(session.idToken);
        }
      })
    });
  }

  ////////////////
  // http calls //
  ////////////////

  use(url: string) {
    this.url = url;
  }

  headers() {
    const h = {"Cache-Control": "no-cache, no-store"};
    const token = this.user.getIdToken();
    if (token) 
      h["Authorization"] = "bearer " + token.getJwtToken();
    return h;
  }

  async post(path: string, body?: any): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.post(this.url+"/api"+path, body, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }

  async get(path: string): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.get(this.url+"/api"+path, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }

  async patch(path: string, body?: any): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.patch(this.url+"/api"+path, body, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }

  async put(path: string, body?: any): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.put(this.url+"/api"+path, body, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }

  async delete(path: string): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.delete(this.url+"/api"+path, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }
}
