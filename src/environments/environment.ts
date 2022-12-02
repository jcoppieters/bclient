// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  name: "BLUE",
  production: false,
  server: "http://localhost:3002",
  cognito: {
    userPoolId: "eu-central-1_uK3hlq0L6", // Blue-Test
    userPoolClientId: "6f8fh3aqo9aoa1anir526gngr2" // Blue-Test
    // userPoolId: "eu-central-1_vaYSfNyYz", // blue-cognito
    // userPoolClientId: "3m9a0852e1fvgtmh89h5oke9jp" // blue-cognito
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
