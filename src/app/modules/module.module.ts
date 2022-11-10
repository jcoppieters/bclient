import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ModulePageRoutingModule } from './module-routing.module';

import { ModulePage } from './module.page';
import { UXModule } from '../ux/ux.module';

@NgModule({
  imports: [
    CommonModule, FormsModule, IonicModule,
    ModulePageRoutingModule,
    UXModule
  ],
  declarations: [ModulePage]
})
export class ModulePageModule {}
