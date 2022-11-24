import { Injectable } from "@angular/core";
import { CanActivate, Router, UrlTree } from "@angular/router";
import { User } from "./user";

console.log("auth.guard.ts");

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private user: User, 
              private router: Router) {
    console.log("AuthGuard.constructor");
  }

  async canActivate(): Promise<boolean | UrlTree> {
    const loggedIn = this.user.isLoggedIn();
    console.log("AuthGuard.CanActivate -> loggedIn: " + loggedIn);

    if (loggedIn) {
      return true;

    } else {
      return this.router.createUrlTree(['/login']);
    }
  }

}