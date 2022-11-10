import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthGuard } from './auth.guard';
import { AutoLogin } from './auth.login';


@NgModule({
  declarations: [AuthGuard, AutoLogin],
  imports: [
    CommonModule
  ],
  providers: [AuthGuard, AutoLogin]
})
export class AuthModule { }
