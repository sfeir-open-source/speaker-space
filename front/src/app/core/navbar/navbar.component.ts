import { Component } from '@angular/core';
import { AuthService } from '../login/services/auth.service';
import { SidebarService } from '../sidebar/service/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isLogin: boolean = false;
  userName: string | null = null;
  userPhotoURL: string | null = null;
  userEmail: string | null = null;
  haveNotification: boolean = true;

  constructor(private authService: AuthService, private sidebarService: SidebarService) {}

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.isLogin = !!user;
      this.userName = user?.displayName || null;
      this.userPhotoURL = user?.photoURL || null;
      this.userEmail = user?.email || null;
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

  openSidebar() {
    this.sidebarService.toggleSidebar(true, {
      displayName: this.userName,
      photoURL: this.userPhotoURL,
      email: this.userEmail
    });
  }
}
