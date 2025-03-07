import { Component } from '@angular/core';
import {ButtonComponent} from "../../../shared/button/button.component";
import {FormsModule} from "@angular/forms";
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';
import {take} from 'rxjs';

@Component({
  selector: 'app-login-form',
    imports: [
        ButtonComponent,
        FormsModule
    ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  email: string = '';
  constructor(protected authService: AuthService, private router: Router) {}

  ngOnInit() {
    const email = localStorage.getItem('emailForSignIn');
    if (email) {
      this.email = email;
    }
    if (this.authService.isSignInWithEmailLink(window.location.href)) {
      this.handleEmailSignIn();
    }
  }

  googleLogin() {
    this.authService.loginWithGoogle();
  }

  gitHubLogin() {
    this.authService.loginWithGitHub();
  }

  mailLinkLogin(email: string) {
    this.authService.sendLink(email);
    if (email && this.authService.isSignInWithEmailLink(window.location.href)) {
      this.authService.confirmSignIn(email, window.location.href)
        .then((user) => {
          if (user) {
            this.router.navigate(['/']);
          }
        });
    }
  }

  private handleEmailSignIn() {
    let email = localStorage.getItem('emailForSignIn');

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
