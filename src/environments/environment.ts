// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

///////////////////
// BlueTestStack //
///////////////////
export const environmentTest = {
  name: "BLUE",
  production: false,
  server: "https://4l8l7tfx50.execute-api.eu-central-1.amazonaws.com",
  cognito: {
    authenticationFlow: 'USER_PASSWORD_AUTH',
    endpoint: "https://cognito-idp.eu-central-1.amazonaws.com/",
    userPoolId: "eu-central-1_imDvAzK5y",
    userPoolClientId: "2eq09jv8qgfh89vi6tjksoapmh",
  }
};

////////////////
// Blue-local //
////////////////
export const environment = {
  name: "BLUE",
  production: false,
  server: "http://localhost:9229/api",
  cognito: {
    authenticationFlow: 'USER_PASSWORD_AUTH',
    endpoint: "http://localhost:9229",
    userPoolId: "local_4l3p1WQj",
    userPoolClientId: "1t3w59coepy98ih5vje7ttyit"
  }
};


/* create the local pool:

aws --endpoint http://localhost:9229 cognito-idp create-user-pool --pool-name blue-dev
## edit ./cognito/db/xxx.json 
aws --endpoint http://localhost:9229 cognito-idp create-user-pool-client --user-pool-id=local_4l3p1WQj --client-name=blue-local

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
