import { environment as env } from "./environment";

export const environment = {
  ...env,
  production: true,
  server: "https://twjhebvbsh.execute-api.eu-central-1.amazonaws.com",
  cognito: {
    authenticationFlow: 'USER_PASSWORD_AUTH',
    
    // blue-user-pool //
    userPoolId: "eu-central-1_XC0RZjrJz",
    userPoolClientId: "jrlkj657vi4vun2rdfjc0uegg" // blue-client
  }

};
