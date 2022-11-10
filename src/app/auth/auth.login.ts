import { Injectable } from "@angular/core";
import { CanActivate, CanLoad, Router, UrlTree } from "@angular/router";
import { UserService } from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class AutoLogin implements CanLoad, CanActivate {

  constructor(private userService: UserService,
              private router: Router) {
    console.log("AutoLogin.constructor");
  }

  async canLoad(): Promise<boolean | UrlTree> {
    console.log("AutoLogin.canLoad -> token: " + this.userService.getToken());

    const loggedIn = this.userService.isLoggedIn();    
    console.log("AutoLogin.canLoad -> returns: " + ! this.userService.isLoggedIn());

    if (loggedIn) {
      return this.router.createUrlTree(['/tabs']);
      
    } else {
      return true;
    }
  }

  async canActivate(): Promise<boolean | UrlTree> {
    console.log("AutoLogin.canActivate -> calling canLoad");
    return this.canLoad();
  }

}