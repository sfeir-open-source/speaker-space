import { Component } from '@angular/core';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isLogin: boolean = false;
  userName: string | null = null;
  haveNotification: boolean = false;

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
