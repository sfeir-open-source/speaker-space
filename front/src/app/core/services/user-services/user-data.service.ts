import { Injectable, signal, computed } from '@angular/core';

interface UserData {
  name?: string | null;
  photoURL?: string | null;
  email?: string | null;
  company?: string;
  location?: string;
  phoneNumber?: string;
  socialLink?: string[];
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private readonly _isSidebarOpen = signal<boolean>(false);
  private readonly _userData = signal<UserData>({});
  readonly isSidebarOpen = this._isSidebarOpen.asReadonly();
  readonly userName = computed(() => this._userData().name || null);
  readonly userPhotoURL = computed(() => this._userData().photoURL || null);
  readonly userEmail = computed(() => this._userData().email || null);
  readonly userCompany = computed(() => this._userData().company || '');
  readonly userLocation = computed(() => this._userData().location || '');
  readonly userPhoneNumber = computed(() => this._userData().phoneNumber || '');
  readonly userSocialLink = computed(() => this._userData().socialLink || '');
  readonly userBio = computed(() => this._userData().bio || '');

  readonly name = computed(() =>
    this.userName() || this.userEmail() || 'Unknown User'
  );

  toggleSidebar(open: boolean, user: UserData | null = null): void {
    this._isSidebarOpen.set(open);

    if (user) {
      this._userData.set({
        name: user.name || null,
        photoURL: user.photoURL || 'assets/img/profil-picture.svg',
        email: user.email || 'No email',
        company: user.company || '',
        location: user.location || '',
        phoneNumber: user.phoneNumber || '',
        socialLink: user.socialLink || [],
        bio: user.bio || ''
      });
    }
  }
}
