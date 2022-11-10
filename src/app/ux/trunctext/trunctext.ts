import { Component, Input } from "@angular/core";

@Component({
  selector: 'trunc-text',
  templateUrl: './trunctext.html',
  styleUrls: ['./trunctext.scss']
})
export class TruncTextComponent {
  @Input() text = "";
  @Input() limit: number = 256;
  truncating = true;

  toggle() {
    this.truncating = ! this.truncating;
  }
}
