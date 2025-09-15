import {Component} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {ActivatedRoute} from '@angular/router';
import {AuthErrorDialogComponent} from '../../../shared/auth-error-dialog/auth-error-dialog.component';
import {ButtonLoginComponent} from '../components/button-login/button-login.component';
import {AuthService} from '../services/auth.service';
import {EmailModalComponent} from '../components/email-modal/email-modal.component';

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
export class LoginFormComponent {
  email: string = '';
  isEmailModalOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const email = sessionStorage.getItem('emailForSignIn');
    if (email) {
      this.email = email;
    }
    if (this.authService.isSignInWithEmailLink(window.location.href)) {
      this.handleEmailSignIn();
    }

    this.route.queryParams.subscribe(params => {
      const showEmailModal = params['showEmailModal'];
      const emailParam = params['email'];

      if (showEmailModal === 'true' && emailParam) {
        this.email = emailParam;
        const modal = document.getElementById('crud-modal');
        if (modal) {
          modal.classList.remove('hidden');
        }
      }
    });
  }

  googleLogin() {
    this.authService.loginWithGoogle();
  }

  gitHubLogin() {
    this.authService.loginWithGitHub();
  }

  mailLinkLogin(email: string) {
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

  private handleEmailSignIn() {
    let email = sessionStorage.getItem('emailForSignIn');

    if (!email) {
      this.route.queryParams.subscribe(params => {
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
    this.isEmailModalOpen = true;
  }

  closeEmailModal(): void {
    this.isEmailModalOpen = false;
  }
}
