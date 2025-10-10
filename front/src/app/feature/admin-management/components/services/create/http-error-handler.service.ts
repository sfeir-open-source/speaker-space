import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ValidationError {
  field?: string;
  defaultMessage?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class HttpErrorHandlerService {

  extractSessionErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400 && error.error?.errors) {
      const validationErrors = error.error.errors as ValidationError[];
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors[0].defaultMessage || validationErrors[0].message || 'Validation error';
      }
    }

    if (error.error?.message) {
      return error.error.message;
    }

    const statusMessages: Record<number, string> = {
      400: 'Invalid session data. Please check your inputs.',
      403: 'You do not have permission to create sessions for this event.',
      404: 'Event not found.',
      409: 'A session with this title already exists.',
      500: 'Server error. Please try again later.'
    };

    return statusMessages[error.status] || 'Failed to create session. Please try again.';
  }
}
