import { Injectable } from "@angular/core";
import { CanActivate, Router, UrlTree } from "@angular/router";
import { UserService } from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private userService: UserService, 
              private router: Router) {
    console.log("AuthGuard.constructor");
  }

  async canActivate(): Promise<boolean | UrlTree> {
    const loggedIn = this.userService.isLoggedIn();
    console.log("AuthGuard.CanActivate -> loggedIn: " + loggedIn);

    if (loggedIn) {
      return true;

    } else {
      return this.router.createUrlTree(['/login']);
    }
  }

}