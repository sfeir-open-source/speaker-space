import {Component, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-session-languages-field',
  imports: [
    FormsModule
  ],
  templateUrl: './session-languages-field.component.html',
  standalone: true,
  styleUrl: './session-create-popup.component.scss'
})
export class SessionLanguagesFieldComponent {
  selectedLanguages = signal<string[]>([]);

  commonLanguages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];

  onLanguageChange(languageCode: string, event: Event): void {
    const target = event.target as HTMLInputElement;

    if (target.checked) {
      this.selectedLanguages.update(languages => [...languages, languageCode]);
    } else {
      this.selectedLanguages.update(languages =>
        languages.filter(code => code !== languageCode)
      );
    }
  }
}
