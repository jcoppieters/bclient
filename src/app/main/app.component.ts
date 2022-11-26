import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { UserEvent, User } from '../auth/user';
import logger from '../core/logger';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
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

  constructor(private user: User, 
              private navCtrl: NavController) {  
  }

  ngOnInit() {
    logger.log("app", "AppComponent.ngOnInit");

    this.user.on(UserEvent.kLoggedIn, () => {
      logger.log("app", "AppComponent.ngOnInit -> kLoggedIn");
      this.username = this.user.getUserData()?.name || "";
      this.navCtrl.navigateRoot(this.appPages[0].url);
    });

    this.user.on(UserEvent.kLoggedOut, () => {
      logger.log("app","AppComponent.ngOnInit -> kLoggedOut");
      this.username = "--";
      this.navCtrl.navigateRoot("/login");
    });

    if (!this.loggedIn()) {
      this.username = "--";
      this.navCtrl.navigateRoot("/login");
    } else {
      this.username = this.user.getUserData()?.name || "";
    }
  }

  public loggedIn(): boolean {
    return this.user.isLoggedIn();
  }

  public doLogout() {
    this.user.logout();
  }

}