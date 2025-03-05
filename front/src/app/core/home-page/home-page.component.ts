import { Component } from '@angular/core';
import {IsLogoutHomePageComponent} from './is-logout-home-page/is-logout-home-page-component';
import {IsLoginHomePageComponent} from './is-login-home-page/is-login-home-page.component';
import {AuthService} from '../login/services/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [IsLoginHomePageComponent, IsLogoutHomePageComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  isLogin: boolean = false;
  userName: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.isLogin = !!user;
      this.userName = user?.displayName || null;
    });
  }

  get displayName(): string | null {
    return this.userName;
  }

  get isUserLoggedIn(): boolean {
    return this.isLogin;
  }

}
