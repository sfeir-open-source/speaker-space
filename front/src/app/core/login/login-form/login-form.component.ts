import {Component} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';
import {AuthErrorDialogComponent} from '../../../shared/auth-error-dialog/auth-error-dialog.component';
import {ButtonLoginComponent} from '../components/button-login/button-login.component';

@Component({
  selector: 'app-login-form',
    imports: [
        ButtonLoginComponent,
        FormsModule
    ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  email: string = '';
  constructor(protected authService: AuthService, private router: Router) {}

  ngOnInit() {
    const email = sessionStorage.getItem('emailForSignIn');
    if (email) {
      this.email = email;
    }
    if (this.authService.isSignInWithEmailLink(window.location.href)) {
      this.handleEmailSignIn();
    }
    const params = new URLSearchParams(window.location.search);
    const showEmailModal = params.get('showEmailModal');
    const emailParam = params.get('email');

    if (showEmailModal === 'true' && emailParam) {
      this.email = emailParam;
      const modal = document.getElementById('crud-modal');
      if (modal) {
        modal.classList.remove('hidden');
      }
    }
  }

  googleLogin() {
    this.authService.loginWithGoogle();
  }

  gitHubLogin() {
    this.authService.loginWithGitHub();
  }

  mailLinkLogin(email: string) {
    if (!email) {
      this.authService.dialog.open(AuthErrorDialogComponent, {
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

  private handleEmailSignIn() {
    let email = sessionStorage.getItem('emailForSignIn');

    if (!email) {
      const params = new URLSearchParams(window.location.search);
      email = params.get('email');

      if (!email) {
        email = window.prompt('Please enter your email for confirmation');
        if (!email) return;
      }
    }

    if (email) {
      this.authService.confirmSignIn(email, window.location.href)
    }
  }
}
