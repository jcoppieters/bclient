import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonInput, NavController, ToastController } from '@ionic/angular';

import { AuthService } from '../auth/auth.service';
import { BlueEvent, UserService } from '../auth/user.service';
import { ServerStatus } from '../core/types';
import { doAlert, doError, doToast } from '../ux/ux';
import { getLanguage, setLanguage, weird, _ } from '../ux/translate/translate';


@Component({
  selector: 'login-page',
  templateUrl: 'login.html',
  styleUrls: ['login.scss']
})
export class LoginPage implements AfterViewInit {
  current = "login";
  showPage = false;

  email: string;      emailOK: boolean;
  password: string;   passwordOK: boolean;
  name: string;       nameOK: boolean;

  language;

  @ViewChild('emailRef') emailInput: IonInput;
  @ViewChild('passwordRef') passwordInput: IonInput;

  constructor(private authService: AuthService, 
              private navCtrl: NavController, 
              private router: Router,
              private ref: ChangeDetectorRef,
              private toastCtrl: ToastController,
              private alertCtrl: AlertController,
              private userService: UserService) {

    const user = this.userService.getUser();
    this.email = user.email || "";
    this.password = "";
    this.name = user.name || "";   
    
    this.language = getLanguage();
    this.current = (user?.id) ? "login" : "register";

    if (this.userService.isLoggedIn()) {
      console.log("LoginPage.constructor -> isLoggedIn = true -> redirect")
      this.router.navigateByUrl('/module/client', { replaceUrl: true })
    } else {
      this.showPage = true;
    }
  }

  ngAfterViewInit() {
    if (this.showPage) {
      this.ref.detectChanges();

      // select correct field
      setTimeout(() => {
        if ((this?.email.length === 0) || (this.current === "forgotten"))
          this.emailInput?.setFocus();
        else
          this.passwordInput?.setFocus();
      }, 250);
    }
  }

  reFocus() {
    this.ngAfterViewInit();
  }

  changeLanguage() {
    console.log("language changed: " + this.language);
    setLanguage(this.language);
  }


  ///////////////////////////
  // Changes - validations //
  ///////////////////////////
  changed() {
    this.nameOK = (this.name.length >= 4);
    this.passwordOK = (this.password.length >= 6);
    this.emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  registerOK(): boolean {
    this.changed();
    return this.emailOK && this.nameOK && this.passwordOK;
  }
  loginOK(): boolean {
    this.changed();
    return this.emailOK && this.passwordOK;
  }
  forgotOK(): boolean {
    this.changed();
    return this.emailOK;
  }


  ////////////////
  // submitting //
  ////////////////
  async doSubmit() {
    if (this.current === "login")
      return this.login();

    else if (this.current === "register")
      return this.register();

    else if (this.current === "forgot")
    return this.forgot();
  }
  
  async login() {
    if (this.loginOK()) {
      const resp = await this.authService.login({email: this.email, password: this.password, language: this.language});
      console.log(resp);
      if (resp.status === ServerStatus.kOK) {
        this.userService.signal(BlueEvent.kLoggedIn);
        this.navCtrl.navigateRoot('module');

      } else {
        doError(this.alertCtrl, resp.message);
      }
    }
  }

  async register() {
    if (this.registerOK()) {
      const resp = await this.authService.register({email: this.email, password: this.password, name: this.name, language: this.language});
      console.log(resp);
      if (resp.status === ServerStatus.kOK) {
        this.navCtrl.navigateRoot('module');
        doToast(this.toastCtrl, "Account created");

      } else {
        doError(this.alertCtrl, resp.message);
      }
    }
  }

  async forgot() {
    if (this.forgotOK()) {
      const resp = await this.authService.forgot({email: this.email, language: this.language});
      console.log(resp);
      if (resp.status === ServerStatus.kOK) {
        doAlert(this.alertCtrl, _("login.willSend"));

      } else {
        doError(this.alertCtrl, resp.message);
      }
    }
  }

}
