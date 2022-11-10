import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { Mode } from '@ionic/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { UXModule } from '../ux/ux.module';

import { HttpService } from '../core/httpService';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../auth/user.service';
import { LoginPageModule } from '../login/login.module';
import { HttpClientModule } from '@angular/common/http';


const setModeViaQueryparam = (): Mode | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const modeFromQueryparam = urlParams.get('mode');
  switch (modeFromQueryparam) {
    case 'ios': return 'ios';
    case 'md': return 'md';
    default: return undefined;
  }
};

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule,  UXModule,
            LoginPageModule, 
            IonicModule.forRoot({ backButtonText: '', mode: setModeViaQueryparam() })],
  providers: [HttpService, AuthService, UserService, 
              { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
