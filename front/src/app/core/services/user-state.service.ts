import {computed, Injectable, signal} from '@angular/core';
import {User} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userState = signal<User | null>(null);

  readonly user = computed(() => this.userState());
  readonly displayName = computed(() => this.userState()?.displayName || '');
  readonly email = computed(() => this.userState()?.email || '');
  readonly photoURL = computed(() => this.userState()?.photoURL || 'img/profil-picture.svg');
  readonly company = computed(() => this.userState()?.company || '');
  readonly city = computed(() => this.userState()?.city || '');
  readonly phoneNumber = computed(() => this.userState()?.phoneNumber || '');
  readonly githubLink = computed(() => this.userState()?.githubLink || '');
  readonly twitterLink = computed(() => this.userState()?.twitterLink || '');
  readonly blueSkyLink = computed(() => this.userState()?.blueSkyLink || '');
  readonly linkedInLink = computed(() => this.userState()?.linkedInLink || '');
  readonly otherLink = computed(() => this.userState()?.otherLink || '');
  readonly biography = computed(() => this.userState()?.biography || '');

  updateUser(user: Partial<User>): void {
    this.userState.update(currentUser => ({
      ...(currentUser || {}),
      ...user
    } as User));
  }

  loadFromStorage(): void {
    const userData: Partial<User> = {};

    const keys = [
      'userDisplayName', 'userPhotoURL', 'userEmail', 'userCompany',
      'userCity', 'userPhoneNumber', 'userGithubLink', 'userTwitterLink',
      'userBlueSkyLink', 'userLinkedInLink','userOtherLink','userBiography'
    ];

    const keyMapping: Record<string, keyof User> = {
      'userDisplayName': 'displayName',
      'userPhotoURL': 'photoURL',
      'userEmail': 'email',
      'userCompany': 'company',
      'userCity': 'city',
      'userPhoneNumber': 'phoneNumber',
      'userGithubLink': 'githubLink',
      'userTwitterLink': 'twitterLink',
      'userBlueSkyLink': 'blueSkyLink',
      'userLinkedInLink': 'linkedInLink',
      'userOtherLink': 'otherLink',
      'userBiography': 'biography'
    };

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        const userKey = keyMapping[key] as keyof User;
        userData[userKey] = value;
      }
    });

    if (Object.keys(userData).length > 0) {
      this.updateUser(userData);
    }
  }

  saveToStorage(): void {
    const user = this.userState();
    if (!user) return;

    const keyMapping: Partial<Record<keyof User, string>> = {
      'displayName': 'userDisplayName',
      'photoURL': 'userPhotoURL',
      'email': 'userEmail',
      'company': 'userCompany',
      'city': 'userCity',
      'phoneNumber': 'userPhoneNumber',
      'githubLink': 'userGithubLink',
      'twitterLink': 'userTwitterLink',
      'blueSkyLink': 'userBlueSkyLink',
      'linkedInLink': 'userLinkedInLink',
      'uid': 'userId',
      'biography': 'userBiography',
      'otherLink': 'userOtherLink'
    };

    Object.entries(user).forEach(([key, value]) => {
      if (value && keyMapping[key as keyof User]) {
        localStorage.setItem(<string>keyMapping[key as keyof User], value.toString());
      }
    });
  }

  clearUser(): void {
    this.userState.set(null);

    const keys = [
      'userDisplayName', 'userPhotoURL', 'userEmail', 'userCompany',
      'userCity', 'userPhoneNumber', 'userGithubLink', 'userTwitterLink',
      'userBlueSkyLink', 'userLinkedInLink', 'userId', 'userBiography', 'userOtherLink',
      'userOtherLink','userBiography'
    ];

    keys.forEach(key => localStorage.removeItem(key));
  }

}
