import { ServerResponse, YN } from "../core/types";

export enum Tabs {
  kOffers = 'offers',
  kJobs = 'jobs',
  kTimeRegistration = 'registration',
  kInvoice = 'invoice'
}
export const kEmptyTabs = {
  offers: true,
  jobs: true,
  registration: true,
  invoice: true
}

export interface TabSettings {
  [key: string]: boolean
}
export interface Settings {
  // rate an offer
  rating: boolean;

  // tabs in list books
  tabs: TabSettings;
}
export const kEmptySettings = { 
  rating: true, 
  tabs: {}
};


export interface UserData {
  id?: number;
  name: string;
  email: string;
  settings: Settings;
  language: string;
  phone: string;
  username?: string;  // Cognito UID
}
export const kEmptyUser: UserData = { 
  name: "", email: "", phone: "",
  settings: {...kEmptySettings}, 
  language: "EN"
};

export interface UserRegister {
  name: string;
  email: string;
  password: string;
  language: string;
  phone: string;
}

export interface UserLogin {
  email: string;
  password: string;
  language?: string;
}

export interface UserForgot {
  email: string;
  language?: string;
}


export interface AuthResponse extends ServerResponse {
  user: UserData
  token: string;
  expires: number;
}

export interface UserResponse extends ServerResponse {
  user: UserData;
}



export function settings(user: UserData): Settings {
  // check if settings are there or already json-parsed
  if (typeof user.settings === "string") {
    try {
      user.settings = JSON.parse(user.settings);
    } catch(e) {
      user.settings = {...kEmptySettings}
    }
  }

  // set default while upgrading user pref records
  if (!user.settings) 
    user.settings = {...kEmptySettings};
  if (!user.settings.tabs)
    user.settings.tabs = {};

  // be sure to have all tabs so we can auto-add tabs later in the user settings
  const tabs = {};
  Object.values(Tabs).forEach(t => tabs[t] = !!user.settings.tabs[t]);
  user.settings.tabs = tabs;

  return user.settings as Settings;
}