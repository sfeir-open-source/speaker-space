import { Component, signal, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from '@angular/router';
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

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  constructor() {
    effect(() => {
      if (this.authService.isSignInWithEmailLink(window.location.href)) {
        this.handleEmailSignIn();
      }
    });
  }

  ngOnInit(): void {
    const storedEmail = sessionStorage.getItem('emailForSignIn');
    if (storedEmail) {
      this.email.set(storedEmail);
    }

    this.route.queryParams
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const showEmailModal = params['showEmailModal'];
        const emailParam = params['email'];

        if (showEmailModal === 'true' && emailParam) {
          this.email.set(emailParam);
          this.openEmailModal();
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
    if (!email) {
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

  private handleEmailSignIn(): void {
    let email = sessionStorage.getItem('emailForSignIn');

    if (!email) {
      this.route.queryParams
        .pipe(takeUntilDestroyed())
        .subscribe(params => {
          email = params['email'];

          if (!email) {
            email = window.prompt('Please enter your email for confirmation');
            if (!email) return;
          }

          if (email) {
            this.authService.confirmSignIn(email, window.location.href);
          }
        });
    } else if (email) {
      this.authService.confirmSignIn(email, window.location.href);
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
}
