import {booleanAttribute, Component, Input, OnInit, SimpleChanges} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
export class InputComponent implements OnInit {
  sanitizedIconPath: SafeHtml = '';
  @Input() iconViewBox: string = '0 0 16 16';
  @Input() label?: string = '';
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

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (this.required && !this.control.hasValidator(Validators.required)) {
      const currentValidators = this.control.validator ? [this.control.validator, Validators.required] : Validators.required;
      this.control.setValidators(currentValidators);
      this.control.updateValueAndValidity();
    }
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
    return this.control?.invalid && this.control?.touched;
  }

  get errorMessages(): string[] {
    if (!this.hasError) return [];

    const errors = this.control.errors || {};
    const messages: string[] = [];

    if (errors['required']) messages.push(this.errorMessage);
    if (errors['email']) messages.push('Please enter a valid email address');
    if (errors['minlength']) messages.push(`Minimum length is ${errors['minlength'].requiredLength} characters`);
    if (errors['maxlength']) messages.push(`Maximum length is ${errors['maxlength'].requiredLength} characters`);
    if (errors['pattern']) messages.push('The value does not match the required pattern');

    return messages;
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['iconPath'] && this.iconPath) {
      let cleanPath = this.iconPath;

      if (cleanPath.trim().startsWith('<svg')) {
        this.sanitizedIconPath = this.sanitizer.bypassSecurityTrustHtml(cleanPath);
      } else {
        this.sanitizedIconPath = this.sanitizer.bypassSecurityTrustHtml(
          `<svg role="presentation" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="h-5 w-5" viewBox="${this.iconViewBox}">${cleanPath}</svg>`
        );
      }
    }
  }
}
