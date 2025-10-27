import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class EventValidators {

  static startDateAfterToday(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      try {
        const selectedDate = new Date(control.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          return { startDatePast: { value: control.value } };
        }
        return null;
      } catch {
        return { invalidDate: { value: control.value } };
      }
    };
  }

  static endDateAfterStart(startDateControlName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !control.parent) {
        return null;
      }

      const startDateControl = control.parent.get(startDateControlName);
      if (!startDateControl || !startDateControl.value) {
        return null;
      }

      try {
        const startDate = new Date(startDateControl.value);
        const endDate = new Date(control.value);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (endDate < startDate) {
          return { endBeforeStart: { startDate: startDateControl.value, endDate: control.value } };
        }
        return null;
      } catch {
        return { invalidDate: { value: control.value } };
      }
    };
  }

  static eventNameMinLength(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const trimmedValue = control.value.trim();
      if (trimmedValue.length < minLength) {
        return {
          minlength: {
            requiredLength: minLength,
            actualLength: trimmedValue.length
          }
        };
      }
      return null;
    };
  }

  static validUrl(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value || value.trim() === '') {
        return null;
      }

      const trimmedValue = value.trim();

      try {
        const urlToTest = trimmedValue.startsWith('http')
          ? trimmedValue
          : `https://${trimmedValue}`;

        const url = new URL(urlToTest);

        if (!url.hostname ||
          !url.hostname.includes('.') ||
          url.hostname === '.' ||
          url.hostname.startsWith('.') ||
          url.hostname.endsWith('.')) {
          return {
            invalidUrl: {
              value: trimmedValue,
              message: 'Please enter a valid URL (e.g., https://example.com)'
            }
          };
        }

        return null;

      } catch {
        return {
          invalidUrl: {
            value: trimmedValue,
            message: 'Please enter a valid URL (e.g., https://example.com)'
          }
        };
      }
    };
  }
}
