import { ActionSheetController, AlertController, ModalController, PopoverController, ToastController } from '@ionic/angular';
import { _ } from '../ux/translate/translate';

interface AlertOptions {
  buttons?: Array<{id: string, text: string}>;
  message?: string;
  title?: string;
}
export function doAlert(alertCtrl: AlertController, options: AlertOptions | string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    if (typeof options === "string") options = {message: options};
    if (!options) options = {};
    if (!options.buttons) options.buttons = [{text: "OK", id: "OK"}];

    const buttons = options.buttons.map(b => {
      return {text: b.text, 
              handler: () => resolve(b.id)};
    });
    const alert = await alertCtrl.create({
      header: options.title || _("global.app"),
      message: options.message,
      buttons
    });
    await alert.present();
  });
}

export async function doError(alertCtrl: AlertController, message: string) {
  return new Promise(async (resolve, reject) => {
    const alert = await alertCtrl.create({
      header: _("global.app"),
      subHeader: _("global.weird"),
      message,
      buttons: [{text: _("global.sorry"), handler: () => resolve("OK")}]
    });
    await alert.present();
  });
}

export async function doChoice(alertCtrl: AlertController, 
  params: {title?: string, question?: string, yes?: string, no?: string}): Promise<boolean> {

  const options = {
    title: params.title,
    message: params.question || "OK?",
    buttons: [
      {text: params.yes || "Yes", role: "YES"},
      {text: params.no || "No", role: "NO"}
    ],
    inputs: []
  };
  const answer = await doAsk(alertCtrl, options);
  return (answer.role === "YES");
}

export function doAsk(alertCtrl: AlertController, options): Promise<any> {
  return new Promise(async (resolve, reject) => {
    if (!options) options = {};
    if (!options.buttons) options.buttons = [{text: "OK", role: "OK"}];
    if (typeof options.backdropDismiss === "undefined") options.backdropDismiss = true;

    const buttons = options.buttons.map(b => {
      return {text: b.text, role: b.role,
              handler: (data) => { b.handler && b.handler(data); resolve({role: b.role, data}); }};
    });
    if (!options.inputs) options.inputs = [{type: 'text', name: 'data'}];

    const alert = await alertCtrl.create({
      header: options.title || _("global.app"),
      message: options.message,
      buttons: buttons,
      inputs: options.inputs,
      backdropDismiss: !! options.backdropDismiss
    });
    await alert.present();
  });
}

export interface ModalResult {
  data: any;
  role: string;
}

export async function doModal(modalCtrl: ModalController,
                              component: any, componentProps, cssClass?): Promise<ModalResult> {
  const modal = await modalCtrl.create({ backdropDismiss: false, component, componentProps, cssClass });
  await modal.present();
  const { data, role } = await modal.onDidDismiss();
  
  return { data: data || {}, role: role || ""};
}

export async function doPopup(popoverCtl: PopoverController, component, data, cssClass?): Promise<HTMLIonPopoverElement> {
  data = data || {};
  const popover = await popoverCtl.create({
    component, cssClass,
    //event: ev,
    translucent: true,
    componentProps: data
  });
  await popover.present();
  return popover;
}


export async function doToast(toastCtl: ToastController, message: string, duration: number = 600) {
  const toast = await toastCtl.create({
    message, duration, position: 'middle'
  });
  toast.present();
}


export async function doActionSheet(actionSheetController: ActionSheetController, 
                                    header: string, buttons, addCancel = false): Promise<string> {
  let result = "";
  
  if (buttons?.length > 1) {
    buttons.forEach(b => { 
      if (!b.role) b.role = b.text 
      if (!b.handler) b.handler = () => result = b.role 
    });
    if (addCancel)
      buttons.push({ text: 'Cancel', role: 'cancel' });

    const actionSheet = await actionSheetController.create({ header, buttons });
    await actionSheet.present();
    result = (await actionSheet.onDidDismiss())?.role;
  }
  // console.log("doActionSheet -> ", result);
  return result;
}