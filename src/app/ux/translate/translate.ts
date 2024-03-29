import { UserData } from "../../auth/types";
import { environment } from '../../../environments/environment';
import { translations } from "../../../app.translations";
import { Device } from '@capacitor/device';
import logger from "../../core/logger";

let gLanguage;
let gDeviceLanguage;

Device.getLanguageCode().then(value => {
  gDeviceLanguage = value?.value?.toUpperCase().substring(0, 2);
  logger.log("app", "setting deviceLanguage to: " + gDeviceLanguage)
});


export function getLanguage(): string {
  if (gLanguage) return gLanguage;

  try {
    const user = JSON.parse(localStorage.getItem(environment.name + ".USER")) as UserData;
    gLanguage = user?.language || gDeviceLanguage || "EN";
  } catch(e) {
    gLanguage = gDeviceLanguage || "EN";
  }

  return gLanguage;
}

export function setLanguage(language?: string): string {
  if ("EN,NL,FR".indexOf(language) >= 0) {
    gLanguage = language;
  } else {
    gLanguage = "XX"
  }
  let user = {} as UserData;
  try {
    user = JSON.parse(localStorage.getItem(environment.name + ".USER"));
  } catch(e) {
  }
  user.language = gLanguage;
  localStorage.setItem(environment.name + ".USER", JSON.stringify(user));

  logger.log("app", "*** changed language to " + gLanguage);
  return gLanguage;
}


export function translate(value: string, language?: string): string {
  if (!value) { return '[** empty **]'; }

  if (!language) language = getLanguage();

  if (language === 'XX') {
    return '[' + value + ']';
  }

  if (typeof translations[language] === 'undefined') {
    return '[** no-' + language + ': ' + value + ' **]';
  } 

  const tran = translations[language][value];
  if (typeof tran === 'undefined') {
    return '[** no-trn: ' + value + ' **]';
  }

  return tran;
}

export function _(key: string, language?: string): string {
  return translate(key, language);
}

export function weird(message: string): string {
  const weird = translations[gLanguage]['global.weird'];
  if (weird) {
    return weird + " (" + message + ")";
  } else {
    return message;
  }
}
