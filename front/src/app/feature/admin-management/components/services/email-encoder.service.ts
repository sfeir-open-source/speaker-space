import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailEncoderService {

  encodeToBase64(email: string): string {
    if (!email || email.trim() === '') {
      throw new Error('Email cannot be null or empty');
    }

    try {
      return btoa(email.trim());
    } catch (error) {
      throw new Error('Failed to encode email to Base64');
    }
  }

  decodeFromBase64(encodedEmail: string): string {
    if (!encodedEmail || encodedEmail.trim() === '') {
      throw new Error('Encoded email cannot be null or empty');
    }

    try {
      return atob(encodedEmail.trim());
    } catch (error) {
      throw new Error('Failed to decode email from Base64');
    }
  }
}
