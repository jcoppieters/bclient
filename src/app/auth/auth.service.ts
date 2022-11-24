import { Injectable } from '@angular/core';
import { AuthenticationDetails, CodeDeliveryDetails, CognitoAccessToken, CognitoIdToken, CognitoRefreshToken, CognitoUser, CognitoUserAttribute, CognitoUserPool, CognitoUserSession, ISignUpResult } from 'amazon-cognito-identity-js';
import { environment } from '../../environments/environment';
import { HttpService } from '../core/httpService';
import { ServerResponse, ServerStatus } from '../core/types';
import { AuthResponse, UserRegister, UserData, UserResponse } from './types';

export interface ILoginUser {
  email: string;
  password: string;
  name: string;
  phone: string;
}

const poolData = {
  UserPoolId: environment.cognito.userPoolId, 
  ClientId: environment.cognito.userPoolClientId
};
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
          console.log("AuthService.newPassword -> success: ", data);


          resolve({status: ServerStatus.kOK})
        },
        onFailure: (err: Error) => {
          console.log("AuthService.forgot -> failure: ", err);
          resolve({status: ServerStatus.kNOK, message: err.message})
        }
      });
    });
  }

  async register(user: UserRegister): Promise<ServerResponse> {
    // select our Cognito attributes, phone is only "\+[0-9]+"
    if (user.phone) user.phone = awsPhone(user.phone);
    const attributes = blueAttributes.map(a => new CognitoUserAttribute({Name: a, Value: user[a]}));

    return new Promise((resolve, reject) => {
      userPool.signUp(user.email, user.password, attributes, [], (err, result: ISignUpResult) => {
        if (err) {
          console.log("AuthService.register -> error registering", err);
          resolve({status: ServerStatus.kNOK, message: err.message});

        } else {
          // already remember the user, but no token yet
          this.user.setUserData({email: user.email, language: user.language, name: user.name});

          // create the user in the database, ignore if failed??? 
          //TODO -> partial registration -> delete in Cognito?
          this.registerDBUser(user.email, user.name, user.language, user.phone)
            .then(result => resolve(result))
            .catch(err => resolve({status: ServerStatus.kOK, message: result.codeDeliveryDetails.AttributeName}));
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
          this.verifyDBUser(email)
            .then(result => resolve(result))
            .catch(err => resolve({status: ServerStatus.kOK, message: result.codeDeliveryDetails.AttributeName}));
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

    return new Promise<AuthResponse | ServerResponse>((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result: CognitoUserSession) => {
          console.log("AuthService.login -> Authenticated by Cognito: ", result);

          const accessToken: CognitoAccessToken = result.getAccessToken();
          const idToken: CognitoIdToken = result.getIdToken();
          const refreshToken: CognitoRefreshToken = result.getRefreshToken();

          this.user.login(idToken, accessToken, refreshToken);

          // ask our server for more client details based on the access-token
          // DB operation uses current token
          // return the user + id-token/expiry
          this.getDBUser()
            .then( resp => resolve({...resp, token: idToken.getJwtToken(), expires: idToken.getExpiration()}))
            .catch( err => resolve({status: ServerStatus.kError, message: err.message}) );
        },

        newPasswordRequired(userAttributes, []) {
          console.log("AuthService.login -> newPasswordRequired: ", userAttributes);
          cognitoUser.completeNewPasswordChallenge(password, {}, this);
        },

        onFailure: (err) => {
          console.log("AuthService.authenticate -> Cognito error: " + err.message, err);
          resolve(err)
        }
      });
    });
  }

  async logout(): Promise<void> {
    let cognitoUser = userPool.getCurrentUser();
    cognitoUser?.signOut(() => {
      this.user.logout();
    });
  }


  async getUser(): Promise<AuthResponse> {
    try {
      const serverResponse = await this.getDBUser();
      if (serverResponse.status === ServerStatus.kOK) {
        console.log("AuthService.getUser -> Authenticated by Server: ", serverResponse);
        this.user.setUserData(serverResponse.user);

        const idToken: CognitoIdToken = this.user.getIdToken();
        const token = idToken.getJwtToken();
        const expires = idToken.getExpiration();

        return {status: serverResponse.status, user: serverResponse.user as UserData, token, expires};

      } else {
        return {...serverResponse, user: null, token: "", expires: 0}; 
      }

    } catch(e) {
      console.log("AuthService.user -> Server error: ", e.message, e);
      return {status: ServerStatus.kError, user: null, token: "", expires: 0, message: e.message}
    }
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
  async registerDBUser(email: string, name: string, language: string, phone: string): Promise<ServerResponse> {
    try {
      return this.post("/auth/register", {user: {email, name, language, phone}});

    } catch(err) {
      return {status: ServerStatus.kError, message: err.message}
    }
  }
  async verifyDBUser(email: string): Promise<ServerResponse> {
    try {
      return this.post("/auth/verify", {email});

    } catch(err) {
      return {status: ServerStatus.kError, message: err.message}
    }
  }

  async updateDBUser(user: UserData): Promise<UserResponse> {
    return <Promise<UserResponse>> this.patch("/auth/update", {user});
  }

  async getDBUser(): Promise<UserResponse> {
    // using the token in the header to select the user
    return <Promise<UserResponse>> this.get("/auth/user");
  }

  async deleteDBUser(): Promise<ServerResponse> {
    // delete from server
    return <Promise<ServerResponse>> this.delete("/auth/user");
  }

}
