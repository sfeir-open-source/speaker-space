import {computed, Injectable, signal} from '@angular/core';
import {User} from '../../models/user.model';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  user = signal<User | null>(null);
  name = computed(() => this.user()?.name || '');
  email = computed(() => this.user()?.email || '');
  photoURL = computed(() => this.user()?.photoURL || '');
  company = computed(() => this.user()?.company || '');
  city = computed(() => this.user()?.city || '');
  phoneNumber = computed(() => this.user()?.phoneNumber || '');
  githubLink = computed(() => this.user()?.githubLink || '');
  twitterLink = computed(() => this.user()?.twitterLink || '');
  blueSkyLink = computed(() => this.user()?.blueSkyLink || '');
  linkedInLink = computed(() => this.user()?.linkedInLink || '');
  otherLink = computed(() => this.user()?.otherLink || '');
  biography = computed(() => this.user()?.biography || '');

  eventIds = computed(() => this.user()?.eventIds || []);
  hasSpeakerRole = computed(() => this.eventIds().length > 0);

  loadFromStorage(): void {
    const userData: Partial<User> = {};

    const stringKeys: Record<string, keyof Pick<User, 'name' | 'photoURL' | 'email' | 'company' | 'city' | 'phoneNumber' | 'githubLink' | 'twitterLink' | 'blueSkyLink' | 'linkedInLink' | 'otherLink' | 'biography'>> = {
      'userName': 'name',
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

    const arrayKeys: Record<string, keyof Pick<User, 'speakerIds' | 'eventIds' | 'sessionIds'>> = {
      'userSpeakerIds': 'speakerIds',
      'userEventIds': 'eventIds',
      'userSessionIds': 'sessionIds'
    };

    Object.entries(stringKeys).forEach(([storageKey, userKey]) => {
      const value = localStorage.getItem(storageKey);
      if (value) {
        (userData as any)[userKey] = value;
      }
    });

    Object.entries(arrayKeys).forEach(([storageKey, userKey]) => {
      const value = localStorage.getItem(storageKey);
      if (value) {
        try {
          const parsedValue = JSON.parse(value);
          if (Array.isArray(parsedValue)) {
            (userData as any)[userKey] = parsedValue;
          }
        } catch {
          (userData as any)[userKey] = [];
        }
      }
    });

    if (Object.keys(userData).length > 0) {
      this.updateUser(userData);
    }
  }

  saveToStorage(): void {
    const user = this.user();
    if (!user) return;

    const storageMapping = {
      name: 'userName',
      photoURL: 'userPhotoURL',
      email: 'userEmail',
      company: 'userCompany',
      city: 'userCity',
      phoneNumber: 'userPhoneNumber',
      githubLink: 'userGithubLink',
      twitterLink: 'userTwitterLink',
      blueSkyLink: 'userBlueSkyLink',
      linkedInLink: 'userLinkedInLink',
      otherLink: 'userOtherLink',
      biography: 'userBiography',
      speakerIds: 'userSpeakerIds',
      eventIds: 'userEventIds',
      sessionIds: 'userSessionIds'
    };

    Object.entries(storageMapping).forEach(([userKey, storageKey]) => {
      const value = (user as any)[userKey];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          localStorage.setItem(storageKey, JSON.stringify(value));
        } else {
          localStorage.setItem(storageKey, (value));
        }
      }
    });
  }

  updateUser(userData: Partial<User>): void {
    const currentUser = this.user();
    const previousEventCount = currentUser?.eventIds?.length || 0;

    const updatedUser = { ...currentUser, ...userData } as User;

    this.user.set(updatedUser);
    this.userSubject.next(updatedUser);

    const newEventCount = updatedUser.eventIds?.length || 0;
    if (newEventCount > previousEventCount) {
      this.notifySpeakerRoleChange(newEventCount - previousEventCount);
    }
  }

  private notifySpeakerRoleChange(newEventCount: number): void {
    console.log(`${newEventCount} nouveaux rôles speaker détectés`);
  }


  clearUser(): void {
    this.user.set(null);
    this.userSubject.next(null);
    this.clearStorage();
  }

  private clearStorage(): void {
    const keysToRemove = [
      'userName', 'userPhotoURL', 'userEmail', 'userCompany',
      'userCity', 'userPhoneNumber', 'userGithubLink', 'userTwitterLink',
      'userBlueSkyLink', 'userLinkedInLink', 'userOtherLink', 'userBiography',
      'userSpeakerIds', 'userEventIds', 'userSessionIds'
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}
