import { Component } from '@angular/core';
import {AuthService} from '../login/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isLogin: boolean = false;
  userName: string | null = null;
  userPhotoURL: string | null = null;
  haveNotification: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.isLogin = !!user;
      this.userName = user?.displayName || null;
      this.userPhotoURL = user?.photoURL || null;
    });
  }

  get displayName(): string | null {
    return this.userName;
  }

  get isUserLoggedIn(): boolean {
    return this.isLogin;
  }

  handlePictureError(event: any) {
    event.target.src = 'img/profil-picture.svg';
  }

  logout() {
    this.authService.logout();
  }
}
