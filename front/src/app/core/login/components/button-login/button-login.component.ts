import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Component({
  selector: 'app-button-login',
  imports: [CommonModule],
  templateUrl: './button-login.component.html',
  styleUrl: './button-login.component.scss'
})
export class ButtonLoginComponent {
  @Input() buttonType: string = 'action';
  @Input() disabled: boolean = false;
  @Input() iconPath: string = '';
  @Input() iconViewBox: string = '0 0 16 16';

  sanitizedIconPath: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    if (this.iconPath) {
      this.sanitizedIconPath = this.sanitizer.bypassSecurityTrustHtml(
        `<svg role="presentation" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="h-5 w-5" viewBox="${this.iconViewBox}">${this.iconPath}</svg>`
      );
    }
  }
}
