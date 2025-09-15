import {computed, Injectable, signal} from '@angular/core';
import {User} from '../../models/user.model';

const STORAGE_TO_USER_MAPPING: Record<string, keyof User> = {
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

const STORAGE_KEYS = Object.keys(STORAGE_TO_USER_MAPPING);

const USER_TO_STORAGE_MAPPING: Partial<Record<keyof User, string>> = {
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

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userState = signal<User | null>(null);

  readonly user = computed(() => this.userState());
  readonly displayName = computed(() => this.userState()?.displayName || '');
  readonly email = computed(() => this.userState()?.email || '');
  readonly photoURL = computed(() => this.userState()?.photoURL || 'assets/img/profil-picture.svg');
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

    STORAGE_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        const userKey = STORAGE_TO_USER_MAPPING[key] as keyof User;
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

    Object.entries(user).forEach(([key, value]) => {
      if (value && USER_TO_STORAGE_MAPPING[key as keyof User]) {
        localStorage.setItem(<string>USER_TO_STORAGE_MAPPING[key as keyof User], value.toString());
      }
    });
  }

  clearUser(): void {
    this.userState.set(null);


    STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
  }

}
