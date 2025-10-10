import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SpeakerErrorHandlerService {
  extractSpeakerErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400 && error.error?.errors) {
      const validationErrors = error.error.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors[0].defaultMessage || validationErrors[0];
      }
    }

    if (error.error?.message) {
      return error.error.message;
    }

    const statusMessages: Record<number, string> = {
      400: 'Invalid data provided. Please check your inputs.',
      409: 'A speaker with this email already exists in this event.',
      403: 'You do not have permission to create speakers for this event.',
      404: 'Event not found.',
      500: 'Server error. Please try again later.'
    };

    return statusMessages[error.status] || 'Failed to create speaker. Please try again.';
  }
}
