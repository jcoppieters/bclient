import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LoginPage } from './login';
import { LoginPageRoutingModule } from './login.routing';

import { UXModule } from "../ux/ux.module";

@NgModule({
  imports: [
    IonicModule, CommonModule, FormsModule,
    UXModule, LoginPageRoutingModule
  ],
  declarations: [LoginPage],
  exports: [LoginPage]
})
export class LoginPageModule {}
