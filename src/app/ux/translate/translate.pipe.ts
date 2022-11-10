import { Pipe, PipeTransform } from '@angular/core';
import { translate } from './translate';

@Pipe({
  name: '_', pure: false
})
export class TranslatePipe implements PipeTransform {

  transform(key: string): string {
    return translate(key);
  }
}
