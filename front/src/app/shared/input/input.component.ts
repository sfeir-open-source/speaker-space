import {
  booleanAttribute,
  Component,
  output,
  input,
  computed,
  effect,
  signal,
  DestroyRef,
  inject
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly iconViewBox = input<string>('0 0 16 16');
  readonly label = input<string>('');
  readonly paragraph = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly control = input.required<FormControl>();
  readonly required = input<boolean, boolean>(false, { transform: booleanAttribute });
  readonly name = input<string>('');
  readonly errorMessage = input<string>('This field is required');
  readonly disabled = input<boolean, boolean>(false, { transform: booleanAttribute });
  readonly rows = input<number>(6);
  readonly icon = input<string>('');
  readonly iconPath = input<string>('');
  readonly customClass = input<string>('');
  readonly staticPlaceholder = input<string>('');
  readonly isRequired = input<boolean>(false);
  readonly minLength = input<number>(2);
  readonly serverErrors = input<Record<string, string> | null>(null);
  readonly options = input<{ value: string; label: string }[]>([]);

  readonly blur = output<void>();

  private readonly sanitizedIconPath = signal<SafeHtml>('');

  readonly effectivePlaceholder = computed(() => {
    const staticPlaceholder = this.staticPlaceholder();
    const placeholder = this.placeholder();

    if (staticPlaceholder) {
      return staticPlaceholder;
    }
    if (placeholder && placeholder !== 'undefined') {
      return placeholder;
    }
    return '';
  });

  readonly isTextarea = computed(() => this.type() === 'textarea');
  readonly isSelect = computed(() => this.type() === 'select');
  readonly hasIcon = computed(() => {
    const icon = this.icon();
    return icon !== undefined && icon !== '';
  });

  readonly hasError = computed(() => {
    const control = this.control();
    if (!control) {
      return false;
    }
    return control.invalid && (control.touched || control.dirty);
  });

  readonly errorMessages = computed(() => {
    if (!this.hasError() || !this.control()) {
      return [];
    }

    const errors = this.control().errors || {};
    const messages: string[] = [];
    const errorMessage = this.errorMessage();
    const name = this.name();

    if (errors['required']) {
      messages.push(errorMessage || 'This field is required');
    }

    if (errors['email']) {
      messages.push('Please enter a valid email address');
    }

    if (errors['minlength']) {
      if (errorMessage && errorMessage.includes('minimum')) {
        messages.push(errorMessage);
      } else {
        messages.push(`Minimum length is ${errors['minlength'].requiredLength} characters`);
      }
    }

    if (errors['maxlength']) {
      messages.push(`Maximum length is ${errors['maxlength'].requiredLength} characters`);
    }

    if (errors['pattern']) {
      if (name.toLowerCase().includes('link') || name === 'avatarPictureURL') {
        messages.push(errorMessage || 'Please enter a valid URL');
      } else if (name === 'phoneNumber') {
        messages.push(errorMessage || 'Please enter a valid phone number');
      } else {
        messages.push(errorMessage || 'The value does not match the required pattern');
      }
    }

    if (errors['serverError']) {
      messages.push(errors['serverError']);
    }

    if (messages.length === 0 && Object.keys(errors).length > 0) {
      messages.push(errorMessage || 'Invalid value');
    }

    return messages;
  });

  readonly sanitizedIcon = computed(() => this.sanitizedIconPath());

  constructor() {
    effect(() => {
      const iconPath = this.iconPath();
      const iconViewBox = this.iconViewBox();

      if (!iconPath) {
        this.sanitizedIconPath.set('');
        return;
      }

      try {
        if (iconPath.trim().startsWith('<svg')) {
          this.sanitizedIconPath.set(this.sanitizer.bypassSecurityTrustHtml(iconPath));
        } else {
          const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="${iconViewBox}" fill="currentColor">${iconPath}</svg>`;
          this.sanitizedIconPath.set(this.sanitizer.bypassSecurityTrustHtml(svgWrapper));
        }
      } catch (error) {
        console.error('Error processing SVG:', error, iconPath);
        this.sanitizedIconPath.set('');
      }
    });

    effect(() => {
      const control = this.control();
      const required = this.required();
      const minLength = this.minLength();
      const type = this.type();
      const name = this.name();

      if (!control) {
        return;
      }

      try {
        const validators: ValidatorFn[] = [];

        if (required) {
          validators.push(Validators.required);
        }

        if (minLength && minLength > 0) {
          validators.push(Validators.minLength(minLength));
        }

        if (type === 'email') {
          validators.push(Validators.email);
        }

        if (name === 'phoneNumber') {
          validators.push(Validators.pattern('^(\\+?[0-9\\s.-]{6,})?$'));
        } else if (name === 'avatarPictureURL' || name.toLowerCase().includes('link')) {
          validators.push(Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'));
        }

        control.setValidators(validators.length > 0 ? validators : null);
        control.updateValueAndValidity();

      } catch (error) {
        console.error(`Erreur lors de l'application des validateurs pour le champ '${name}':`, error);
      }
    });
  }

  onInputBlur(): void {
    const control = this.control();
    if (control) {
      control.markAsTouched();
    }
    this.blur.emit();
  }
}
