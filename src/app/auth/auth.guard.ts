import { Injectable } from "@angular/core";
import { CanActivate, Router, UrlTree } from "@angular/router";
import logger from "../core/logger";
import USER from "./user";


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {
    logger.log("auth", "AuthGuard.constructor");
  }

  async canActivate(): Promise<boolean | UrlTree> {
    const loggedIn = USER.isLoggedIn();
    logger.log("auth", "AuthGuard.CanActivate -> loggedIn: " + loggedIn);

    if (loggedIn) {
      return true;

    } else {
      return this.router.createUrlTree(['/login']);
    }
  }

}