import { Injectable } from "@angular/core";
import { CanActivate, CanLoad, Router, UrlTree } from "@angular/router";
import USER from "./user";

@Injectable({
  providedIn: 'root'
})
export class AutoLogin implements CanLoad, CanActivate {

  constructor(private router: Router) {
    console.log("AutoLogin.constructor");
  }

  async canLoad(): Promise<boolean | UrlTree> {
    console.log("AutoLogin.canLoad -> id-token: " + USER.getIdToken());

    const loggedIn = USER.isLoggedIn();    
    console.log("AutoLogin.canLoad -> returns: " + ! loggedIn);

    if (loggedIn) {
      return !! this.router.createUrlTree(['/tabs']);
      
    } else {
      return true;
    }
  }

  async canActivate(): Promise<boolean | UrlTree> {
    console.log("AutoLogin.canActivate -> calling canLoad");
    return this.canLoad();
  }

}