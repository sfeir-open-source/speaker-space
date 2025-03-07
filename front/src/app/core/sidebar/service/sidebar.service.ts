import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isSidebarOpen = false;
  userName: string | null = null;
  userPhotoURL: string | null = null;
  userEmail: string | null = null;

  toggleSidebar(open: boolean, user: any = null) {
    this.isSidebarOpen = open;
    if (user) {
      this.userName = user.displayName || user.email;
      this.userPhotoURL = user.photoURL || 'img/profil-picture.svg';
      this.userEmail = user.email || 'No email';
    }
  }
}
