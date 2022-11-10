import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslatePipe } from './translate/translate.pipe';
import { TruncTextComponent } from './trunctext/trunctext';

 
@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  providers: [TranslatePipe],
  declarations: [TranslatePipe, TruncTextComponent],
  exports: [TranslatePipe, TruncTextComponent],
  schemas: []
})
export class UXModule {}
