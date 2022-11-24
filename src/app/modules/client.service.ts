import { Injectable } from "@angular/core";
import { HttpService } from "../core/httpService";
import { ServerResponse } from "../core/types";

@Injectable({
  providedIn: 'root'
})
export class ClientService extends HttpService {

  async search(q: string): Promise<ServerResponse> {
    const resp = <any> await this.get("/clients/search?q=" + q);
    console.log("ClientService.search -> resp: ", resp);
    return resp;
  }
}