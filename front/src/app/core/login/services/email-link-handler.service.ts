import { Injectable, inject } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  Auth,
  signInWithEmailLink,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  fetchSignInMethodsForEmail,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
} from '@angular/fire/auth';
import {AuthBackendService} from './auth-backend.service';
import {AuthErrorHandlerService} from './auth-error-handler';
import {take} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailLinkHandlerService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authBackend = inject(AuthBackendService);
  private readonly errorHandler = inject(AuthErrorHandlerService);

  async sendEmailLink(email: string): Promise<boolean | null> {
    const actionCodeSettings = {
      url: `${window.location.origin}/login?email=${encodeURIComponent(email.toLowerCase())}`,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      sessionStorage.setItem('emailForSignIn', email.toLowerCase());

      this.errorHandler.showSuccessDialog(
        'Email Sent',
        'A sign-in link has been sent to your email address.'
      );

      return true;
    } catch (error: any) {
      console.error('Error sending email link:', error);

      this.errorHandler.showSuccessDialog(
        'Error',
        'Failed to send sign-in link. Please try again.'
      );
      return null;
    }
  }

  async confirmSignIn(email: string, url: string): Promise<FirebaseUser | null> {
    if (!isSignInWithEmailLink(this.auth, url)) {
      return null;
    }

    try {
      await setPersistence(this.auth, browserLocalPersistence);
      const result = await signInWithEmailLink(this.auth, email, url);

      sessionStorage.removeItem('emailForSignIn');

      if (result.user) {
        await this.authBackend.processUserLogin(result.user);

        window.history.replaceState({}, document.title, '/');

        await this.router.navigate(['/']);
      }

      return result.user;
    } catch (error: any) {
      console.error('Email sign-in error:', error);

      if (error.code === 'auth/invalid-action-code') {
        this.errorHandler.showSuccessDialog(
          'Link Expired',
          'This sign-in link has expired. Please request a new one.'
        );
      }

      return null;
    }
  }

  isSignInWithEmailLink(url: string): boolean {
    return isSignInWithEmailLink(this.auth, url);
  }

  checkEmailLink(): void {
    if (!this.isSignInWithEmailLink(window.location.href)) {
      return;
    }

    const storedEmail = sessionStorage.getItem('emailForSignIn');

    if (storedEmail) {
      this.processEmailSignIn(storedEmail);
    } else {
      this.route.queryParams.pipe(
        take(1)
      ).subscribe(params => {
        const emailParam = params['email'];

        if (emailParam) {
          this.processEmailSignIn(emailParam);
        } else {
          const userEmail = window.prompt('Please enter your email for confirmation');
          if (userEmail) {
            this.processEmailSignIn(userEmail);
          }
        }
      });
    }
  }

  private async processEmailSignIn(email: string): Promise<void> {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
      const result = await signInWithEmailLink(this.auth, email, window.location.href);

      sessionStorage.removeItem('emailForSignIn');

      if (result.user) {
        await this.authBackend.processUserLogin(result.user);

        window.history.replaceState({}, document.title, '/');

        await this.router.navigate(['/']);
      }
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      if (error.code === 'auth/invalid-action-code') {
        this.errorHandler.showSuccessDialog(
          'Link Expired',
          'This sign-in link has expired. Please request a new one.'
        );
      }
    }
  }
}
