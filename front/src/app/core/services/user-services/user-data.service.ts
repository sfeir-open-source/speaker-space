import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  isSidebarOpen = false;
  userName: string | null = null;
  userPhotoURL: string | null = null;
  userEmail: string | null = null;
  userCompany: string = '';
  userCity: string = '';
  userPhoneNumber: string = '';
  userGithubLink: string = '';
  userTwitterLink: string = '';
  userBlueSkyLink: string = '';
  userLinkedInLink: string = '';
  userOtherLink: string = '';
  userBiography: string = '';

  toggleSidebar(open: boolean, user: any = null) {
    this.isSidebarOpen = open;
    if (user) {
      this.userName = user.displayName || user.email;
      this.userPhotoURL = user.photoURL || 'img/profil-picture.svg';
      this.userEmail = user.email || 'No email';
      this.userCompany = user.company || '';
      this.userCity = user.city || '';
      this.userPhoneNumber = user.phoneNumber || '';
      this.userGithubLink = user.githubLink || '';
      this.userTwitterLink = user.twitterLink || '';
      this.userBlueSkyLink = user.blueSkyLink || '';
      this.userLinkedInLink = user.linkedInLink || '';
      this.userOtherLink = user.otherLink || '';
      this.userBiography = user.biography || '';
    }
  }
}
