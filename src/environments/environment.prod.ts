import { environment as env } from "./environment";

export const environment = {
  ...env,
  production: true,
  server: "https://tipnznq7b3.execute-api.eu-central-1.amazonaws.com",
  cognito: {
    authenticationFlow: 'USER_PASSWORD_AUTH',
    
    ///////////////////
    // BlueTestStack //
    ///////////////////
    endpoint: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_6WeXlBTwu",
    userPoolId: "eu-central-1_6WeXlBTwu",
    userPoolClientId: "676ksbd0qldo4b9sa4p040d0jp",
  }

};
