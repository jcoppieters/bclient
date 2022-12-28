import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerStatus } from '../core/types';
import { ClientService } from './client.service';

@Component({
  selector: 'app-module',
  templateUrl: './module.page.html',
  styleUrls: ['./module.page.scss'],
})
export class ModulePage implements OnInit {
  public module: string;
  public users = [];
  public name: string = "";
  public email: string = "";
  public message: string = "";
  public q: string = "";
  

  constructor(private activatedRoute: ActivatedRoute,
              private clientService: ClientService) { }

  ngOnInit() {
    this.module = this.activatedRoute.snapshot.paramMap.get('id');
  }

  cleanup(o: any): string {
    const s = JSON.stringify(o, null, 2);
    return s;
    //return s.replace('{', "").replace('}', '').replace(/,/g, '\n').replace(/\"/g, '');
  }

  other(user): string {
    const r = {...user};
    delete r.name;
    delete r.email;
    return this.cleanup(r);
  }

  async search(lambda) {
    console.log("ModulePage.search -> q = " + this.q);
    const resp = await this.clientService.search(lambda, this.q);
    if (resp.status === ServerStatus.kOK) {
      this.users = resp.users as Array<any>;
      this.message = "response count: " + this.users.length;
    } else {
      this.users = [];
      this.message = "error: " + this.cleanup(resp);
    }
  }

  async add(lambda) {
    console.log("ModulePage.add -> name: " + this.name + ", email: " + this.email);
    const resp = await this.clientService.add(lambda, this.name, this.email);
    if (resp.status === ServerStatus.kOK) {
      this.message = "response: " + this.cleanup(resp);
    } else {
      this.message = "error: " + this.cleanup(resp);
    }
  }

}
