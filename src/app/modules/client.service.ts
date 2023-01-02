import { Injectable } from "@angular/core";
import { HttpService } from "../core/httpService";
import { ServerResponse } from "../core/types";

@Injectable({
  providedIn: 'root'
})
export class ClientService extends HttpService {

  async search(q: string): Promise<ServerResponse> {
    let resp = <any> await this.get(`/demo/list?q=${q}`);
    console.log("ClientService.search() -> resp: ", resp);
    return resp;
  }

  async add(name: string, email: string) {
    let resp = <any> await this.post(`/demo/add`, {user: {name, email, language: "NL"}});
    console.log("ClientService.add() -> resp: ", resp);
    return resp;
  }
}