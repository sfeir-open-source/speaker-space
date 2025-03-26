import { booleanAttribute, Component, Input, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() control!: FormControl;
  @Input({transform: booleanAttribute}) required: boolean = false;
  @Input() name: string = '';
  @Input() errorMessage: string = 'This field is required';
  @Input({transform: booleanAttribute}) disabled: boolean = false;
  @Input() rows: number = 6;
  @Input() icon?: string;

  ngOnInit() {
    if (this.required && !this.control.hasValidator(Validators.required)) {
      const currentValidators = this.control.validator ? [this.control.validator, Validators.required] : Validators.required;
      this.control.setValidators(currentValidators);
      this.control.updateValueAndValidity();
    }
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
}
