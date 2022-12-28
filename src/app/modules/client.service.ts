import { Injectable } from "@angular/core";
import { HttpService } from "../core/httpService";
import { ServerResponse } from "../core/types";

@Injectable({
  providedIn: 'root'
})
export class ClientService extends HttpService {

  async search(lambda: string, q: string): Promise<ServerResponse> {
    let resp = <any> await this.get(`/${lambda}/list?q=${q}`);
    console.log("ClientService.search("+lambda+") -> resp: ", resp);
    return resp;
  }

  async add(lambda: string, name: string, email: string) {
    let resp = <any> await this.post(`/${lambda}/add`, {user: {name, email}});
    console.log("ClientService.add("+lambda+") -> resp: ", resp);
    return resp;
  }
}