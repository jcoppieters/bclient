// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  name: "BLUE",
  production: false,
  //server: "http://localhost:9229/api",
  server: "https://twjhebvbsh.execute-api.eu-central-1.amazonaws.com",
  cognito: {
    authenticationFlow: 'USER_PASSWORD_AUTH',

    // Blue-local //
    // endpoint: "http://localhost:9229",
    // userPoolId: "local_5MhnM5Q5",
    // userPoolClientId: "4f1sv0gs5c78mkacekxzzmu3a",
    
    // blue-user-pool //
    userPoolId: "eu-central-1_XC0RZjrJz",
    userPoolClientId: "jrlkj657vi4vun2rdfjc0uegg", // blue-client

  }
};

/* create the local pool:

aws --endpoint http://localhost:9229 cognito-idp create-user-pool --pool-name blue-dev
## edit ./cognito/db/xxx.json 
aws --endpoint http://localhost:9229 cognito-idp create-user-pool-client --user-pool-id=local_5MhnM5Q5 --client-name=blue-local

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
