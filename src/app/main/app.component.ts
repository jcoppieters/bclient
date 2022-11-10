import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { BlueEvent, UserService } from '../auth/user.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'clients', url: '/module/clients', icon: 'people' },
    { title: 'offers', url: '/module/offers', icon: 'document' },
    { title: 'jobs', url: '/module/jobs', icon: 'calendar-clear' },
    { title: 'invoices', url: '/module/invoices', icon: 'document-text' },
    { title: 'reports', url: '/module/reports', icon: 'documents' },
  ];
  public username = "Worker Man";
  public actions = [
    { title: 'todo', url: "", icon: 'bookmark'}, 
    { title: 'reminders', url: "", icon: 'bookmark'}
  ];

  constructor(private userService: UserService, 
              private navCtrl: NavController) {  
  }

  ngOnInit() {
    this.userService.on(BlueEvent.kLoggedIn, () => {
      this.navCtrl.navigateRoot(this.appPages[0].url);
    });
    this.userService.on(BlueEvent.kLoggedOut, () => {
      this.navCtrl.navigateRoot("/login");
    });

    if (!this.loggedIn()) {
      this.navCtrl.navigateRoot("login");
    }
  }

  public loggedIn(): boolean {
    return this.userService.isLoggedIn();
  }

  public doLogout() {
    this.userService.logout();
  }

}