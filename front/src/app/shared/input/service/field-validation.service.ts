import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn, Validators, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FieldValidationService {

  buildAutoValidators(config: {
    required: boolean;
    minLength: number;
    type: string;
    name: string;
  }): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (config.required) {
      validators.push(Validators.required);
    }

    if (config.minLength && config.minLength > 0) {
      validators.push(Validators.minLength(config.minLength));
    }

    if (config.type === 'email') {
      validators.push(Validators.email);
    }

    if (config.name === 'phoneNumber') {
      validators.push(Validators.pattern('^(\\+?[0-9\\s.-]{6,})?$'));
    } else if (config.name === 'avatarPictureURL' || config.name.toLowerCase().includes('link')) {
      validators.push( Validators.pattern('^https?://[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$') );
    }

    return validators;
  }

  getErrorMessages(
    errors: ValidationErrors | null,
    fieldName: string,
    defaultErrorMessage: string
  ): string[] {
    if (!errors) {
      return [];
    }

    const messages: string[] = [];

    if (errors['invalidUrl']) {
      return [errors['invalidUrl'].message || 'Please enter a valid URL'];
    }

    if (errors['email']) {
      return ['Please enter a valid email address'];
    }

    if (errors['pattern']) {
      return [this.getPatternErrorMessage(fieldName, defaultErrorMessage)];
    }

    if (errors['startDatePast']) {
      return ['Start date must be today or in the future'];
    }

    if (errors['endBeforeStart']) {
      return ['End date must be on the same day or after the start date'];
    }

    if (errors['invalidDate']) {
      return ['Please enter a valid date'];
    }

    if (errors['minlength']) {
      return [this.getMinLengthErrorMessage(errors['minlength'], fieldName)];
    }

    if (errors['maxlength']) {
      return [`Maximum length is ${errors['maxlength'].requiredLength} characters`];
    }

    if (errors['serverError']) {
      return [errors['serverError']];
    }

    if (errors['required']) {
      return [defaultErrorMessage || 'This field is required'];
    }

    if (Object.keys(errors).length > 0) {
      return [defaultErrorMessage || 'Invalid value'];
    }

    return messages;
  }

  private getPatternErrorMessage(fieldName: string, defaultMessage: string): string {
    if (fieldName.toLowerCase().includes('link') || fieldName === 'avatarPictureURL') {
      return defaultMessage || 'Please enter a valid URL';
    }

    if (fieldName === 'phoneNumber') {
      return defaultMessage || 'Please enter a valid phone number';
    }

    return defaultMessage || 'The value does not match the required pattern';
  }

  private getMinLengthErrorMessage(
    error: { requiredLength: number; actualLength: number },
    fieldName: string
  ): string {
    const requiredLength = error.requiredLength;

    if (fieldName === 'name' || fieldName === 'eventName') {
      return `Name must be at least ${requiredLength} characters long`;
    }

    return `Minimum length is ${requiredLength} characters`;
  }

  hasVisibleError(control: AbstractControl | null, isSubmitted: boolean): boolean {
    if (!control) {
      return false;
    }
    return control.invalid && (control.touched || control.dirty || isSubmitted);
  }
}
