import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { UserService } from '../auth/user.service';
import { ServerResponse, ServerStatus } from './types';


@Injectable({
  providedIn: 'root'
})
export class HttpService  {
  url: string;

  constructor(private httpClient: HttpClient,
              private router: Router,
              protected userService: UserService) {    
    
    console.log("HttpService.constructor -> using: " + environment.server + ", logged in: " + this.isLoggedIn());
    this.use(environment.server);
  }

  logout() {
    this.userService.logout()
  }

  isLoggedIn(): boolean {
    return this.userService.isLoggedIn();
  }

  async onlyBody(call: Promise<any>): Promise<ServerResponse> {
    try {
      const response = await call;
      
      if (response.headers) {
        const token = response.headers.get("accessToken");
        const expires = response.headers.get("expiresIn");
        if (token && expires)
          this.userService.setPermanent(token, expires);
      }

      // console.log("HttpService.onlyBody -> body: " + JSON.stringify(response.body));
      return response.body;

    } catch(e) {
      console.log("HttpService.onlyBody -> error: " + JSON.stringify(e));

      // authentication failed
      if (e.status === 401) {
        // force log out
        this.logout();
        // redirect to login
        console.log("HttpService.onlyBody -> 401 response -> logout & redirect to login page");
        await this.router.navigateByUrl("/login");
        return {status: ServerStatus.kNOK, message: "Session expired or wrong credentials", code: "authentication failed"}
      }
      return { message: e.statusText, code: e.statusText, ...e, status: ServerStatus.kError};
    }


  }

  ////////////////
  // http calls //
  ////////////////

  use(url: string) {
    this.url = url;
  }

  headers() {
    const h = {"Cache-Control": "no-cache, no-store"};
    const token = this.userService.getToken();
    if (token) 
      h["Authorization"] = "bearer " + token
    return h;
  }

  async post(path: string, body?: any): Promise<ServerResponse> {
    try {
      return this.onlyBody(
        this.httpClient.post(this.url+"/api"+path, body, 
          {responseType: 'json', observe: 'response', headers: this.headers()}
        ).toPromise()
      );
    } catch(err) {
      return {status: ServerStatus.kError, message: err.message}
    }
  }

  async get(path: string): Promise<ServerResponse> {
    try {
      return this.onlyBody(
        this.httpClient.get(this.url+"/api"+path, 
          {responseType: 'json', observe: 'response', headers: this.headers()}
        ).toPromise()
      );
    } catch(err) {
      return {status: ServerStatus.kError, message: err.message}
    }
  }

  async patch(path: string, body?: any): Promise<ServerResponse> {
    try {
      return this.onlyBody(
        this.httpClient.patch(this.url+"/api"+path, body, 
          {responseType: 'json', observe: 'response', headers: this.headers()}
        ).toPromise()
      );
    } catch(err) {
      return {status: ServerStatus.kError, message: err.message}
    }
  }

  async put(path: string, body?: any): Promise<ServerResponse> {
    try {
      return this.onlyBody(
        this.httpClient.put(this.url+"/api"+path, body, 
          {responseType: 'json', observe: 'response', headers: this.headers()}
        ).toPromise()
      );
    } catch(err) {
      return {status: ServerStatus.kError, message: err.message}
    }
  }

  async delete(path: string): Promise<ServerResponse> {
    try {
      return this.onlyBody(
        this.httpClient.delete(this.url+"/api"+path, 
          {responseType: 'json', observe: 'response', headers: this.headers()}
        ).toPromise()
      );
    } catch(err) {
      return {status: ServerStatus.kError, message: err.message}
    }
  }
}
