import { Component } from '@angular/core';
import {ButtonComponent} from '../../common/components/button/button.component';
import {AuthService} from '../../common/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ButtonComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  constructor(protected authService: AuthService) {}
  isLogin: boolean = false;

  ngOnInit() {
    this.isLogin = !!this.authService.user;
  }

  googleLogin() {
    this.authService.loginWithGoogle();
  }

  logout() {
    this.authService.logout();
  }
}
