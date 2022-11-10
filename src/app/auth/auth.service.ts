import { Injectable } from '@angular/core';
import { HttpService } from '../core/httpService';
import { ServerStatus } from '../core/types';
import { AuthResponse, UserLogin, UserRegister, User, UserForgot, kEmptySettings } from './types';


@Injectable({
  providedIn: 'root'
})
export class AuthService extends HttpService {

  async forgot(user: UserForgot): Promise<AuthResponse> {
    const resp = <AuthResponse> await this.post("/auth/forgot", {user});
    return resp;
  }

  async register(user: UserRegister): Promise<AuthResponse> {
    const resp = <AuthResponse> await this.post("/auth/register", {user});

    if ((resp.status === ServerStatus.kOK) && resp.user && resp.accessToken) {
      this.userService.setPermanent(resp.accessToken, resp.expiresIn, resp.user);
    }
    return resp;
  }

  async login(user: UserLogin): Promise<AuthResponse> {
    //const resp = <AuthResponse> await this.post("/auth/login", {user});
    const resp = {status: ServerStatus.kOK, user: {email: "johan@j.j", name: "De Jos", language: "EN", settings: kEmptySettings}, expiresIn: 10000, accessToken: "ok"};

    if ((resp.status === ServerStatus.kOK) && resp.user && resp.accessToken) {
      this.userService.setPermanent(resp.accessToken, resp.expiresIn, resp.user);
    }
    return resp;
  }

  async update(user: User): Promise<AuthResponse> {
    return <AuthResponse> await this.patch("/auth/update", {user});
  }

  async user(): Promise<AuthResponse> {
    return <AuthResponse> await this.get("/auth/user");
  }

  async forgetMe(): Promise<AuthResponse> {
    return <AuthResponse> await this.delete("/auth/user");
  }


}
