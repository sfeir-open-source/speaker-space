import { Component } from '@angular/core';
import {ButtonComponent} from '../../common/components/button/button.component';
import {AuthService} from '../../common/services/auth.service';
import {Router} from '@angular/router';
import { take } from 'rxjs';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [ButtonComponent, FormsModule, ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  email: string = '';
  constructor(protected authService: AuthService, private router: Router) {}

  ngOnInit() {
    const email = localStorage.getItem('emailForSignIn');
    if (email && this.authService.isSignInWithEmailLink(window.location.href)) {
      this.authService.confirmSignIn(email, window.location.href)
        .then((user) => {
          if (user) {
            this.router.navigate(['/']);
          }
        });
    }
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
  }

}
