import { Injectable, signal, computed } from '@angular/core';

interface UserData {
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
  company?: string;
  city?: string;
  phoneNumber?: string;
  githubLink?: string;
  twitterLink?: string;
  blueSkyLink?: string;
  linkedInLink?: string;
  otherLink?: string;
  biography?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private readonly _isSidebarOpen = signal<boolean>(false);
  private readonly _userData = signal<UserData>({});
  readonly isSidebarOpen = this._isSidebarOpen.asReadonly();
  readonly userName = computed(() => this._userData().displayName || null);
  readonly userPhotoURL = computed(() => this._userData().photoURL || null);
  readonly userEmail = computed(() => this._userData().email || null);
  readonly userCompany = computed(() => this._userData().company || '');
  readonly userCity = computed(() => this._userData().city || '');
  readonly userPhoneNumber = computed(() => this._userData().phoneNumber || '');
  readonly userGithubLink = computed(() => this._userData().githubLink || '');
  readonly userTwitterLink = computed(() => this._userData().twitterLink || '');
  readonly userBlueSkyLink = computed(() => this._userData().blueSkyLink || '');
  readonly userLinkedInLink = computed(() => this._userData().linkedInLink || '');
  readonly userOtherLink = computed(() => this._userData().otherLink || '');
  readonly userBiography = computed(() => this._userData().biography || '');

  readonly displayName = computed(() =>
    this.userName() || this.userEmail() || 'Unknown User'
  );

  toggleSidebar(open: boolean, user: UserData | null = null): void {
    this._isSidebarOpen.set(open);

    if (user) {
      this._userData.set({
        displayName: user.displayName || null,
        photoURL: user.photoURL || 'assets/img/profil-picture.svg',
        email: user.email || 'No email',
        company: user.company || '',
        city: user.city || '',
        phoneNumber: user.phoneNumber || '',
        githubLink: user.githubLink || '',
        twitterLink: user.twitterLink || '',
        blueSkyLink: user.blueSkyLink || '',
        linkedInLink: user.linkedInLink || '',
        otherLink: user.otherLink || '',
        biography: user.biography || ''
      });
    }
  }
}
