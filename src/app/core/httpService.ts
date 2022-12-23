import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CognitoIdToken, CognitoUser } from 'amazon-cognito-identity-js';
import { environment } from '../../environments/environment';
import { userPool } from '../auth/auth.service';
import { User } from '../auth/user';
import logger, { LogLevel } from './logger';
import { ServerError, ServerResponse, ServerStatus } from './types';

// Johan Coppieters //
//
// v1.0 - nov 2022 - use id token for each call
// v1.1 - nov 2022 - on first 401 response, try to refresh the id token and re-execute the call once
// v1.2 - dec 2022 - version for lambda function url's

@Injectable({ providedIn: 'root' })
export class HttpService  {
  url: string;

  constructor(private httpClient: HttpClient,
              protected user: User) {    
    
    logger.setLogLevel("http", LogLevel.debug)
    logger.log("http", "HttpService.constructor -> using: " + environment.server + ", logged in: " + this.user.isLoggedIn());
    this.use(environment.server);
  }

  assertOK(httpResponse): ServerResponse {
    // if the body is not json, we will throw with a server-error (500)
    // if status != OK, we will throw with a server-error (= resp.code)

    /* 
    sample httpResonse: {
      body: {status: "ERROR", code: 401, message: "no valid token"},
      headers: {normalizedNames: {}, lazyUpdate: null},
      ok: true,
      status: 200,
      statusText: "OK",
      type: 4,
      url: "http://localhost:9229/api/contacts/list?q=e"
    } 
    
    sample LambdaResponse: {
      clients: [{...}, {...}, ...}],
      code: 200,
      headers: {
        Server-Timing: "db;dur=7, app;dur=54035"
      },
      message: "",
      status: "OK"
    }
    */

    logger.log("http", "HttpService.assertOK -> httpResonse: ", httpResponse);

    // http error
    if (httpResponse.status != 200) {
      const err = new ServerError(httpResponse.statusText, httpResponse.status);
      logger.log("http", "HttpService.assertOK -> throwing http error: ", err);
      throw(err);
    }

    let lambdaResponse = httpResponse.body as ServerResponse;

    // lambda errors (with detail-status in code)
    if ((!lambdaResponse) || (lambdaResponse.status != ServerStatus.kOK)) {
      const err = new ServerError(lambdaResponse.message || lambdaResponse.status, lambdaResponse.code);
      logger.log("http", "HttpService.assertOK -> throwing lambda error: ", err);
      throw(err);
    }

    return lambdaResponse;
  }

  async executor(call: () => Promise<any>): Promise<ServerResponse> {
    try {
      const response = await call();
      logger.log("http", "HttpService.executor (1) -> body: " + JSON.stringify(response.body));
      
      return this.assertOK(response);

    } catch(e) {
      logger.log("http", "HttpService.executor (1) -> error: " + JSON.stringify(e));

      // authentication failed
      if (e.status === 401) {
        try {
          // try to ask new accessToken and re-execute the call (headers will be reconstructed)
          logger.log("http", "HttpService.executor (1) -> Received 401 -> get new token")
          await this.getNewAccessToken();
          const response = await call();

          logger.log("http", "HttpService.executor (2) -> body: " + JSON.stringify(response));
          return this.assertOK(response);

        } catch(e) {
          // if the second call fails -> fail
          
          if (e.status === 401) {
            // either again: authentication failed -> logout in the UX too
            logger.log("http", "HttpService.executor (2) -> 401 response -> logout & redirect to login page");
            this.user.logout();
            return {status: ServerStatus.kError, message: "Session expired or wrong credentials"};

          } else {
            // normal call failure after second try
            logger.err("http", "HttpService.executor (2) -> " + e.statusText + " response -> ", e);
            return { message: e.message, code: e.statusText, ...e, status: ServerStatus.kError};
          }
        }

      } else {
        // normal call failure after first try
        logger.err("http", "HttpService.executor (1) -> " + e.statusText + " response -> ", e);
        return { message: e.statusText, code: e.statusText, ...e, status: ServerStatus.kError};
      }
    }
  }

  async getNewAccessToken(): Promise<CognitoIdToken> {
    const refreshToken = this.user.getRefreshToken();
    const cognitoUser = new CognitoUser({Username: this.user.getUserData()?.email || "", Pool: userPool});

    return new Promise( (resolve, reject) => {
      cognitoUser.refreshSession(refreshToken, (err, session) => {
        if (err) {
          logger.err("http", "HttpService.getNewAccessToken -> Error: ", err);
          reject(err);

        } else {
          logger.log("http", "HttpService.getNewAccessToken -> access token: ", session.accessToken);
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
    const token = this.user.getAccessToken();
    if (token) {
      h["Authorization"] = "bearer " + token.getJwtToken();
      h["XAuthorization"] = "bearer " + token.getJwtToken();
    }
    return h;
  }

  async post(path: string, body?: any): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.post(this.url+path, body, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }

  async get(path: string): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.get(this.url+path, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }

  async patch(path: string, body?: any): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.patch(this.url+path, body, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }

  async put(path: string, body?: any): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.put(this.url+path, body, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }

  async delete(path: string): Promise<ServerResponse> {
    return this.executor(
      () => this.httpClient.delete(this.url+path, 
        {responseType: 'json', observe: 'response', headers: this.headers()}
      ).toPromise()
    );
  }
}
