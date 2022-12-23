import { Injectable } from "@angular/core";
import { HttpService } from "../core/httpService";
import { ServerResponse, ServerStatus } from "../core/types";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService extends HttpService {
  async search(q: string): Promise<ServerResponse> {

    //if (environment.server.indexOf("localhost") < 0)
    //  this.use("https://tyftehgvsysxj4ph3ttlafepj40clopa.lambda-url.eu-central-1.on.aws");

    //const respD = <any> await this.get("/demo/error?code=401");
    //console.log("ClientService.ping -> respD: ", respD);


    if (environment.server.indexOf("localhost") < 0)
      this.use("https://xtvjkx5w52l3nim5rjwwcfczgu0tnsrm.lambda-url.eu-central-1.on.aws");

    let resp = <any> await this.get("/contacts/list?q=" + q);
    console.log("ClientService.search -> resp: ", resp);
    return resp;
  }
}