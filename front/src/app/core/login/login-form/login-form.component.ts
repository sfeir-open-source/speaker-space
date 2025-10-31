import {Component, signal, effect, inject, OnInit, DestroyRef} from '@angular/core';
import { FormsModule } from "@angular/forms";
import {ActivatedRoute, Router} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthErrorDialogComponent } from '../../../shared/auth-error-dialog/auth-error-dialog.component';
import { ButtonLoginComponent } from '../components/button-login/button-login.component';
import { AuthService } from '../services/auth.service';
import { EmailModalComponent } from '../components/email-modal/email-modal.component';

@Component({
  selector: 'app-login-form',
  imports: [
    ButtonLoginComponent,
    FormsModule,
    EmailModalComponent
  ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent implements OnInit {
  email = signal<string>('');
  isEmailModalOpen = signal<boolean>(false);
  isProcessingEmailLink = signal<boolean>(false);

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      if (this.authService.isSignInWithEmailLink(window.location.href)) {
        this.isProcessingEmailLink.set(true);
      }
    });
  }

  ngOnInit(): void {
    const storedEmail = sessionStorage.getItem('emailForSignIn');
    if (storedEmail) {
      this.email.set(storedEmail);
    }

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const showEmailModal = params['showEmailModal'];
        const emailParam = params['email'];

        if (showEmailModal === 'true' && emailParam) {
          this.email.set(emailParam);
          this.openEmailModal();
        }

        if (emailParam && this.authService.isSignInWithEmailLink(window.location.href)) {
          this.handleEmailSignIn(emailParam);
        }
      });
  }

  googleLogin(): void {
    this.authService.loginWithGoogle();
  }

  gitHubLogin(): void {
    this.authService.loginWithGitHub();
  }

  mailLinkLogin(email: string): void {
    if (!email || !this.isValidEmail(email)) {
      this.authService.openDialog(AuthErrorDialogComponent, {
        width: '400px',
        data: {
          title: 'Error',
          message: 'Please enter a valid email address.'
        }
      });
      return;
    }

    this.authService.loginWithEmail(email);
  }

  private async handleEmailSignIn(emailFromUrl?: string): Promise<void> {
    this.isProcessingEmailLink.set(true);

    try {
      let email = sessionStorage.getItem('emailForSignIn');

      if (!email && emailFromUrl) {
        email = emailFromUrl;
      }

      if (!email) {
        email = window.prompt('Please enter your email for confirmation');
        if (!email) {
          this.isProcessingEmailLink.set(false);
          return;
        }
      }

      const user = await this.authService.confirmSignIn(email, window.location.href);

      if (user) {
        window.history.replaceState({}, document.title, '/');
        await this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Error handling email sign-in:', error);
    } finally {
      this.isProcessingEmailLink.set(false);
    }
  }

  openEmailModal(): void {
    this.isEmailModalOpen.set(true);
  }

  closeEmailModal(): void {
    this.isEmailModalOpen.set(false);
  }

  onEmailSubmit(submittedEmail: string): void {
    this.mailLinkLogin(submittedEmail);
    this.closeEmailModal();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;
    return emailRegex.test(email);
  }
}
