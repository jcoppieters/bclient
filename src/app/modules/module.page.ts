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
  public clients = [];

  constructor(private activatedRoute: ActivatedRoute,
              private clientService: ClientService) { }

  ngOnInit() {
    this.module = this.activatedRoute.snapshot.paramMap.get('id');
  }

  async searchChanged(event) {
    if (event?.target) {
      console.log("ModulePage.searchChanged -> q = " + event.target.value);
      const resp = await this.clientService.search(event.target.value);
      if (resp.status === ServerStatus.kOK) {
        this.clients = <any> resp.clients;
      } else {
        this.clients = [{name: "Error !!", person: resp.code, address: resp.message}];
      }
    }
  }

}
