import {booleanAttribute, Component, computed, input, output} from '@angular/core';
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
  selectedLanguages = input<string[]>([]);
  isSubmitted = input<boolean>(false);
  required = input(true, { transform: booleanAttribute });

  languagesChange = output<string[]>();

  commonLanguages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];

  hasError = computed(() => {
    return this.required() &&
      this.isSubmitted() &&
      this.selectedLanguages().length === 0;
  });

  onLanguageChange(languageCode: string, event: Event): void {
    const target = event.target as HTMLInputElement;

    const updatedLanguages = target.checked
      ? [...this.selectedLanguages(), languageCode]
      : this.selectedLanguages().filter(code => code !== languageCode);

    this.languagesChange.emit(updatedLanguages);
  }
}
