import {
  booleanAttribute,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule, ValidatorFn, Validators} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

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
export class InputComponent implements OnInit, OnChanges {
  sanitizedIconPath: SafeHtml = '';
  @Input() iconViewBox: string = '0 0 16 16';
  @Input() label?: string = '';
  @Input() paragraph?: string = '';
  @Input() placeholder?: string = '';
  @Input() type: string = 'text';
  @Input() control!: FormControl;
  @Input({transform: booleanAttribute}) required: boolean = false;
  @Input() name: string = '';
  @Input() errorMessage: string = 'This field is required';
  @Input({transform: booleanAttribute}) disabled: boolean = false;
  @Input() rows: number = 6;
  @Input() icon?: string;
  @Input() iconPath?: string = '';
  @Input() customClass: string = '';
  @Input() staticPlaceholder?: string;
  @Input() isRequired: boolean = false;
  @Input() minLength: number = 2;
  @Input() serverErrors: Record<string, string> | null = null;
  @Output() blur : EventEmitter<void> = new EventEmitter<void>();

  private isInitialized : boolean = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.isInitialized = true;
    this.applyValidators();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['iconPath'] && this.iconPath) {
      try {
        if (this.iconPath.trim().startsWith('<svg')) {
          this.sanitizedIconPath = this.sanitizer.bypassSecurityTrustHtml(this.iconPath);
        } else {
          const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="${this.iconViewBox}" fill="currentColor">${this.iconPath}</svg>`;
          this.sanitizedIconPath = this.sanitizer.bypassSecurityTrustHtml(svgWrapper);
        }
      } catch (error) {
        console.error('Error processing SVG:', error, this.iconPath);
        this.sanitizedIconPath = '';
      }
    }

    if (this.isInitialized && (changes['required'] || changes['minLength'] || changes['control'])) {
      this.applyValidators();
    }
  }

  private applyValidators(): void {
    if (!this.control) {
      console.warn(`FormControl manquant pour le champ '${this.name}'. Les validateurs ne peuvent pas être appliqués.`);
      return;
    }

    if (this.control === null || this.control === undefined) {
      console.warn(`FormControl null ou undefined pour le champ '${this.name}'.`);
      return;
    }

    try {
      const validators: ValidatorFn[] = [];

      if (this.required) {
        validators.push(Validators.required);
      }

      if (this.minLength && this.minLength > 0) {
        validators.push(Validators.minLength(this.minLength));
      }

      if (this.type === 'email') {
        validators.push(Validators.email);
      }

      if (this.name === 'phoneNumber') {
        validators.push(Validators.pattern('^(\\+?[0-9\\s.-]{6,})?$'));
      } else if (this.name === 'avatarPictureURL' || this.name.toLowerCase().includes('link')) {
        validators.push(Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'));
      }

      this.control.setValidators(validators.length > 0 ? validators : null);
      this.control.updateValueAndValidity();

    } catch (error) {
      console.error(`Erreur lors de l'application des validateurs pour le champ '${this.name}':`, error);
    }
  }

  onInputBlur(): void {
    if (this.control) {
      this.control.markAsTouched();
    }
    this.blur.emit();
  }

  get effectivePlaceholder(): string {
    if (this.staticPlaceholder) {
      return this.staticPlaceholder;
    }
    if (this.placeholder && this.placeholder !== 'undefined') {
      return this.placeholder;
    }
    return '';
  }

  get isTextarea(): boolean {
    return this.type === 'textarea';
  }

  get hasIcon(): boolean {
    return this.icon !== undefined && this.icon !== '';
  }

  get hasError(): boolean {
    if (!this.control) {
      return false;
    }

    const shouldShowError: boolean = this.control.invalid && (this.control.touched || this.control.dirty);

    if (shouldShowError) {
      console.debug(`Field ${this.name} has errors:`, this.control.errors);
    }

    return shouldShowError;
  }

  get errorMessages(): string[] {
    if (!this.hasError || !this.control) {
      return [];
    }

    const errors = this.control.errors || {};
    const messages: string[] = [];

    if (errors['required']) {
      messages.push(this.errorMessage || 'This field is required');
    }

    if (errors['email']) {
      messages.push('Please enter a valid email address');
    }

    if (errors['minlength']) {
      if (this.errorMessage && this.errorMessage.includes('minimum')) {
        messages.push(this.errorMessage);
      } else {
        messages.push(`Minimum length is ${errors['minlength'].requiredLength} characters`);
      }
    }

    if (errors['maxlength']) {
      messages.push(`Maximum length is ${errors['maxlength'].requiredLength} characters`);
    }

    if (errors['pattern']) {
      if (this.name.toLowerCase().includes('link') || this.name === 'avatarPictureURL') {
        messages.push(this.errorMessage || 'Please enter a valid URL');
      } else if (this.name === 'phoneNumber') {
        messages.push(this.errorMessage || 'Please enter a valid phone number');
      } else {
        messages.push(this.errorMessage || 'The value does not match the required pattern');
      }
    }

    if (errors['serverError']) {
      messages.push(errors['serverError']);
    }

    if (messages.length === 0 && Object.keys(errors).length > 0) {
      messages.push(this.errorMessage || 'Invalid value');
    }

    return messages;
  }
}
