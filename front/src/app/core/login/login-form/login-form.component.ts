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

  }

  googleLogin() {
    this.authService.loginWithGoogle().then(() => {
      this.authService.user$.pipe(take(1)).subscribe((user) => {
        if (user) {
          this.router.navigate(['/']);
        }
      });
    });
  }

  gitHubLogin() {
    this.authService.loginWithGitHub().then(() => {
      this.authService.user$.pipe(take(1)).subscribe((user) => {
        if (user) {
          this.router.navigate(['/']);
        }
      });
    });
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
}
