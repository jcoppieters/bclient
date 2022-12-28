import { Injectable } from '@angular/core';
import { AuthenticationDetails, CodeDeliveryDetails, CognitoAccessToken, CognitoIdToken, CognitoRefreshToken, CognitoUser, CognitoUserAttribute, CognitoUserPool, CognitoUserSession, ICognitoUserPoolData, ISignUpResult } from 'amazon-cognito-identity-js';
import { environment } from '../../environments/environment';
import { HttpService } from '../core/httpService';
import logger from '../core/logger';
import { ServerResponse, ServerStatus } from '../core/types';
import { AuthResponse, UserRegister, UserData, UserResponse } from './types';
import USER from './user';

export interface ILoginUser {
  email: string;
  password: string;
  name: string;
  phone: string;
}

const poolData: ICognitoUserPoolData = {
  UserPoolId: environment.cognito.userPoolId, 
  ClientId: environment.cognito.userPoolClientId
};
if (environment.cognito["endpoint"])
  poolData.endpoint = environment.cognito["endpoint"];

  
export const userPool = new CognitoUserPool(poolData);
const blueAttributes = ["name", "email", "phone_number", "locale"];

export function awsPhone(phone:string): string {
  if (!phone) return "";

  phone = phone.replace("+", "").replace(/^00/, "").replace(/[^0-9]+/g, "");
  if (phone.charAt(0) != '0') phone = "+" + phone;
  
  return phone;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService extends HttpService {

  // if we want to use the lambda URL's, this is the place to set a URL per service.
  //
  // constructor(httpClient: HttpClient,
  //   user: User) {
  //   super(httpClient, user);
  //   this.use("https://zw4bmv7ftpaddwqmyxfh4h5puy0iqmfo.lambda-url.eu-central-1.on.aws");
  // }

  async resetPassword(email: string): Promise<ServerResponse> {
    return new Promise((resolve, reject) => {
      const cUser = new CognitoUser({Username: email, Pool: userPool});

      cUser.forgotPassword({
        onSuccess: (data) => {
          // I don't think we get here...
          console.log("AuthService.forgot -> success: ", data);
          resolve({status: ServerStatus.kOK})
        },
        onFailure: (err: Error) => {
          console.log("AuthService.forgot -> failure: ", err);
          resolve({status: ServerStatus.kNOK, message: err.message})
        },
        inputVerificationCode: (data: CodeDeliveryDetails) => {
          console.log("AuthService.inputVerificationCode -> verification: ", data);
          resolve({status: ServerStatus.kOK, message: data.AttributeName})
        }
      });
    });
  }
  async confirmPassword(email: string, code: string, password: string): Promise<ServerResponse> {
    return new Promise((resolve, reject) => {
      const cUser = new CognitoUser({Username: email, Pool: userPool});

      cUser.confirmPassword(code, password, {
        onSuccess: (data) => {
          logger.log("auth", "AuthService.newPassword -> success: ", data);


          resolve({status: ServerStatus.kOK})
        },
        onFailure: (err: Error) => {
          logger.err("auth", "AuthService.forgot -> failure: ", err);
          resolve({status: ServerStatus.kNOK, message: err.message})
        }
      });
    });
  }

  async register(user: UserRegister): Promise<ServerResponse> {
    // select our Cognito attributes, phone is only "\+[0-9]+"
    if (user.phone) user.phone = awsPhone(user.phone);
    const attributes = blueAttributes.map(a => new CognitoUserAttribute({Name: a, Value: user[a]}));
    // Cognito uses "phone_number" / hard coded...
    attributes.push(new CognitoUserAttribute({Name: "phone_number", Value: user.phone}))

    return new Promise((resolve, reject) => {
      console.log("register -> USER: ", USER);
      userPool.signUp(user.email, user.password, attributes, [], (err, result: ISignUpResult) => {
        if (err) {
          logger.err("auth", "AuthService.register -> error registering", err);
          resolve({status: ServerStatus.kNOK, message: err.message});

        } else {
          // already remember the user, but no token yet
          logger.debug("auth", "AuthService.register -> SignUpResult: ", result);
          const localUser = {email: user.email, language: user.language, name: user.name, 
                             username: result.userSub};
          USER.setUserData(localUser);
          resolve({status: ServerStatus.kOK, user: localUser});

          // done by a Cognito trigger 
          // this.registerDBUser(localUser)
          //   .then(result => resolve(result))
          //   .catch(err => resolve({status: ServerStatus.kOK, message: result.codeDeliveryDetails.AttributeName}));
        }
      });

    });
  }

  async confirmEmail(email: string, code: string): Promise<ServerResponse> {
    return new Promise((resolve, reject) => {
      const cUser = new CognitoUser({Username: email, Pool: userPool});

      cUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          resolve({status: ServerStatus.kNOK, message: err.message})
        } else {
          const localUser = {email: email, name: cUser.getUsername(), username: result.userSub};
          logger.debug("auth", "AuthService.confirmEmail -> confirmRegistration: ", result, cUser);
          resolve({status: ServerStatus.kOK, user: localUser});

          // Done by a Cognito trigger
          // this.verifyDBUser(email)
          //   .then(result => resolve(result))
          //   .catch(err => resolve({status: ServerStatus.kOK, message: result.codeDeliveryDetails.AttributeName}));
        }
      });
    });
  }

  async login(email: string, password: string): Promise<AuthResponse | ServerResponse> {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    const userData = { 
      Username: email, 
      Pool: userPool
    };
    const cognitoUser = new CognitoUser(userData);
    if (environment.cognito["authenticationFlow"])
      cognitoUser.setAuthenticationFlowType(environment.cognito["authenticationFlow"]);

    return new Promise<AuthResponse | ServerResponse>((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result: CognitoUserSession) => {
          logger.debug("auth", "AuthService.login -> Authenticated by Cognito: ", result);

          const accessToken: CognitoAccessToken = result.getAccessToken();
          const idToken: CognitoIdToken = result.getIdToken();
          const refreshToken: CognitoRefreshToken = result.getRefreshToken();

          USER.login(idToken, accessToken, refreshToken);

          // ask our server for more client details based on the access-token
          // DB operation uses current token
          // return the user + id-token/expiry
          this.getDBUser()
            .then( resp => {
              USER.setUserData(resp.user);
              logger.debug("auth", "AuthService.login -> Data from Database: ", resp);
              resolve({...resp, username: accessToken.payload.username, 
                       token: idToken.getJwtToken(), expires: idToken.getExpiration()});
            })
            .catch( err => {
              resolve({status: ServerStatus.kError, message: err.message});
            });
        },

        newPasswordRequired(userAttributes, []) {
          logger.debug("auth", "AuthService.login -> newPasswordRequired: ", userAttributes);
          cognitoUser.completeNewPasswordChallenge(password, {}, this);
        },

        onFailure: (err) => {
          logger.err("auth", "AuthService.authenticate -> Cognito error: " + err.message, err);
          resolve(err)
        }
      });
    });
  }

  async logout(): Promise<void> {
    let cognitoUser = userPool.getCurrentUser();
    cognitoUser?.signOut(() => {
      USER.logout();
    });
  }
  async globalLogout(): Promise<void> {
    let cognitoUser = userPool.getCurrentUser();
    cognitoUser?.globalSignOut({ 
      onSuccess: (msg: string) => { USER.logout(); },
      onFailure: (err: Error)  => { logger.err("auth", "AuthService.globalLogout -> Cognitor error: " + err.message); }
    });
  }


    /*
CognitoUserSession

  accessToken: CognitoAccessToken
    jwtToken: "eyJraWQiOiJGSDFwd3VQUENWVUlnTDk5NVVxTUZRWWhIUjhiNVwvRldTQm53MFBSdnVGMD0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI4MDNmYmNjZS0yNjgyLTQ3OWMtOGFjOC1jYTM…"
    payload: Object
      auth_time: 1668596468
      client_id: "3m9a0852e1fvgtmh89h5oke9jp"
      event_id: "03068b90-3f05-43bd-8eb3-55386f11b441"
      exp: 1668600068
      iat: 1668596468
      iss: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_vaYSfNyYz"
      jti: "f31c4ddd-b4e1-4d20-8582-735efbadfda4"
      origin_jti: "d949e2fb-be14-40ba-b11b-7a8fcf0305fe"
      scope: "aws.cognito.signin.user.admin"
      sub: "803fbcce-2682-479c-8ac8-ca359baa8d09"
      token_use: "access"
      username: "803fbcce-2682-479c-8ac8-ca359baa8d09"
    clockDrift: 0

  idToken: CognitoIdToken
    jwtToken: "eyJraWQiOiI5T3U4eUdjWTZOanpCQUt1Z3BDQUhpV00rSFZGUnJLa2EzQmo5aGUwbGIwPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI4MDNmYmNjZS0yNjgyLTQ3OWMtOGFjOC1jYTM1…"
    payload: Object
      aud: "3m9a0852e1fvgtmh89h5oke9jp"
      auth_time: 1668596468
      cognito:username: "803fbcce-2682-479c-8ac8-ca359baa8d09"
      email: "johan577@me.com"
      email_verified: true
      event_id: "03068b90-3f05-43bd-8eb3-55386f11b441"
      exp: 1668600068
      iat: 1668596468
      iss: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_vaYSfNyYz"
      jti: "8ae9e7df-f1d2-483b-96a8-1b2f4db17609"
      locale: "EN"
      name: "Johan Coppieters"
      origin_jti: "d949e2fb-be14-40ba-b11b-7a8fcf0305fe"
      phone_number_verified: false
      sub: "803fbcce-2682-479c-8ac8-ca359baa8d09"
      token_use: "id"

    refreshToken: CognitoRefreshToken
      token: "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.MNsGeY6CUtnvSgCu7vnQCyJ9MkLFYR2XW0xp5Xh3OUBtiWhV3Mo0a30H-a6zrYdQloGwJjFANCFf8…"

    */


  async changePW(oldPW: string, newPW: string): Promise<ServerResponse> { 
    const cognitoUser = userPool.getCurrentUser();

    return new Promise((resolve, reject) => {
      cognitoUser.changePassword(oldPW, newPW, (err, result) => {
        if (err) {
          resolve({status: ServerStatus.kError, message: err.message});
        } else {
          // no DB interaction needed
          resolve({status: ServerStatus.kOK, message: result});
        }
      })
    });
  }

  async update(user: UserData): Promise<ServerResponse> {
    if (user.phone) user.phone = awsPhone(user.phone);
    const cognitoUser = userPool.getCurrentUser();

    // select our Cognito attributes
    const attributes = blueAttributes
      .filter(a => typeof user[a] != "undefined")
      .map(a => new CognitoUserAttribute({Name: a, Value: user[a]}));

    return new Promise((resolve, reject) => {
      cognitoUser.updateAttributes(attributes, (err, result) => {
        if (err) {
          resolve({status: ServerStatus.kError, message: err.message});

        } else {
          // now that we updated the attributes in Cognito, update our user record in the database
          this.updateDBUser(user)
            .then( resp => resolve(resp))
            .catch( err => resolve({status: ServerStatus.kError, message: err.message}) );
        }
      });
    });
  }

  async erase(): Promise<ServerResponse> {
    const cognitoUser = userPool.getCurrentUser();
    return new Promise((resolve, reject) => {
      cognitoUser.deleteUser((err, result) => {
        if (err) {
          resolve({status: ServerStatus.kError, message: err.message});

        } else {
          this.deleteDBUser()
            .then( resp => resolve(resp))
            .catch( err => resolve({status: ServerStatus.kError, message: err.message}) );
        }
      });
    });
  }

  //////////////////
  // server stuff //
  //////////////////

  async updateDBUser(user: UserData): Promise<UserResponse> {
    return <Promise<UserResponse>> this.patch("/users/update", {user});
  }

  async getDBUser(): Promise<UserResponse> {
    // using the token in the header to select the user
    console.log("AuthService.getDBUser -> this: ", this);
    return <Promise<UserResponse>> this.get("/demo/list?email=" + USER.getUserData()?.email);
  }

  async deleteDBUser(): Promise<ServerResponse> {
    // delete from server
    return <Promise<ServerResponse>> this.delete("/users/forget");
  }

}
