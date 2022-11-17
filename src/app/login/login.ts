import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonInput, NavController } from '@ionic/angular';

import { AuthService } from '../auth/auth.service';
import { BlueEvent, UserService } from '../auth/user.service';
import { ServerStatus } from '../core/types';
import { doAlert, doError } from '../ux/ux';
import { getLanguage, setLanguage, _ } from '../ux/translate/translate';
import { UserRegister } from '../auth/types';

type PanelActions = "login" | "register" | "forgot" | "confirmPassword" | "confirmEmail";

@Component({
  selector: 'login-page',
  templateUrl: 'login.html',
  styleUrls: ['login.scss']
})
export class LoginPage implements AfterViewInit {
  // show this page (still busy figuring out if we're already logged in)
  showPage = false;

  // show which pane
  current: PanelActions;
  allowConfirmEmail = false;
  allowConfirmPassword = false;
  showPassword = false;

  // input fields
  email: string;      emailOK: boolean;
  password: string;   passwordOK: boolean;
  phone: string;      phoneOK: boolean;
  name: string;       nameOK: boolean;
  code: string;       codeOK: boolean;

  language: string;

  @ViewChild('codeRef') codeInput: IonInput;
  @ViewChild('emailRef') emailInput: IonInput;
  @ViewChild('passwordRef') passwordInput: IonInput;
  @ViewChild('phoneRef') phoneInput: IonInput;

  constructor(private authService: AuthService, 
              private navCtrl: NavController, 
              private router: Router,
              private ref: ChangeDetectorRef,
              private alertCtrl: AlertController,
              private userService: UserService) {

    const user = this.userService.getUser();
    this.email = user.email || "";
    this.password = "";
    this.name = user.name || "";   
    this.phone = user.phone || "";   
    this.code = "";   
    
    this.language = getLanguage();
    this.current = (user?.email) ? "login" : "register";

    if (this.userService.isLoggedIn()) {
      console.log("LoginPage.constructor -> isLoggedIn = true -> redirect")
      this.router.navigateByUrl('/module', { replaceUrl: true })
    } else {
      this.showPage = true;
    }
  }

  ngAfterViewInit() {
    if (this.showPage) {
      this.ref.detectChanges();

      // select correct field
      setTimeout(() => {
        if ((this?.email.length === 0) || (this.current === "forgot") || (this.current === "confirmPassword"))
          this.emailInput?.setFocus();
        else if (this.current === "confirmEmail")
          this.codeInput?.setFocus();
        else
          this.passwordInput?.setFocus();
      }, 250);
    }
  }

  reFocus() {
    this.ngAfterViewInit();
  }

  changeCurrent(current: PanelActions) {
    this.current = current;
    this.reFocus();
  }

  changeLanguage() {
    console.log("language changed: " + this.language);
    this.language = setLanguage(this.language);
  }


  ///////////////////////////
  // Changes - validations //
  ///////////////////////////
  changed() {
    this.nameOK = (this.name.length >= 4);
    this.passwordOK = (this.password.length >= 8);
    this.codeOK = (this.code.length === 6);
    this.phoneOK = (this.phone.length >= 10);
    this.emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  // and "OK" for each action
  registerOK(): boolean {
    this.changed();
    return this.emailOK && this.nameOK && this.passwordOK; // && this.phoneOK;
  }
  confirmEmailOK(): boolean {
    this.changed();
    return this.emailOK && this.codeOK;
  }
  confirmPasswordOK(): boolean {
    this.changed();
    return this.passwordOK && this.codeOK;
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

  async login() {
    if (this.loginOK()) {
      const resp = await this.authService.login(this.email, this.password);
      console.log("LoginPage.login -> authService.login response: ", resp);
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
      const user: UserRegister = {
        email: this.email, password: this.password, 
        name: this.name, language: this.language, 
        phone: ""
      };
      const resp = await this.authService.register(user);
      console.log("LoginPage.register -> authService.register response: ", resp);

      if (resp.status === ServerStatus.kOK) {
        doAlert(this.alertCtrl, _("login.willSend", this.language));
        this.allowConfirmEmail = true;
        this.changeCurrent("confirmEmail");

      } else {
        doError(this.alertCtrl, resp.message);
      }
    }
  }

  async forgot() {
    if (this.forgotOK()) {
      const resp = await this.authService.resetPassword(this.email);
      console.log("LoginPage.forgot -> authService.resetPassword response: ", resp);

      if (resp.status === ServerStatus.kOK) {
        doAlert(this.alertCtrl, _("login.willSend", this.language));
        this.password = "";
        this.allowConfirmPassword = true;
        this.changeCurrent("confirmPassword");

      } else {
        doError(this.alertCtrl, resp.message);
      }
    }
  }

  async confirmEmail() {
    if (this.confirmEmailOK()) {
      const resp = await this.authService.confirmEmail(this.email, this.code);
      console.log("LoginPage.confirmEmail -> authoService.confirmEmail response: ", resp);

      // how do we allow for asking new email confirmations code?
      this.allowConfirmEmail = false;
      this.code = "";

      if (resp.status === ServerStatus.kOK) {
        if (this.loginOK()) {
          await this.login();
        } else {
          doAlert(this.alertCtrl, _("login.nowLogin", this.language));
          this.changeCurrent("login")
        }

      } else {
        doError(this.alertCtrl, resp.message);
      }
    }
  }

  async confirmPassword() {
    if (this.confirmPasswordOK()) {
      const resp = await this.authService.confirmPassword(this.email, this.code, this.password);
      console.log("LoginPage.confirmPassword -> authoService.confirmconfirmPasswordEmail response: ", resp);

      this.allowConfirmPassword = false;
      this.code = "";

      if (resp.status === ServerStatus.kOK) {
        if (this.loginOK()) {
          await this.login();
        } else {
          doAlert(this.alertCtrl, _("login.nowLogin", this.language));
          this.changeCurrent("login")
        }

      } else {
        doError(this.alertCtrl, resp.message);
      }
    }
  }

  async askEmailVerificationCode() {
    doAlert(this.alertCtrl, "Not implemented yet, sorry.");
  }

}
