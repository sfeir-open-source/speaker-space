import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-session-languages-field',
  imports: [
    FormsModule
  ],
  templateUrl: './session-languages-field.component.html',
  styleUrl: './session-create-popup.component.scss'
})
export class SessionLanguagesFieldComponent {
  selectedLanguages: string[] = [];

  commonLanguages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];

  onLanguageChange(languageCode: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedLanguages.push(languageCode);
    } else {
      this.selectedLanguages = this.selectedLanguages.filter(code => code !== languageCode);
    }
  }
}

