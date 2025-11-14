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
  location = computed(() => this.user()?.location || '');
  phoneNumber = computed(() => this.user()?.phoneNumber || '');
  socialLinks = computed(() => this.user()?.socialLinks || []);
  bio = computed(() => this.user()?.bio || '');

  eventIds = computed(() => this.user()?.eventIds || []);
  hasSpeakerRole = computed(() => this.eventIds().length > 0);

  loadFromStorage(): void {
    const userData: Partial<User> = {};

    const stringKeys: Record<string, keyof Pick<User, 'name' | 'photoURL' | 'email' | 'company' | 'location' | 'phoneNumber' | 'bio'>> = {
      'userName': 'name',
      'userPhotoURL': 'photoURL',
      'userEmail': 'email',
      'userCompany': 'company',
      'userLocation': 'location',
      'userPhoneNumber': 'phoneNumber',
      'userBio': 'bio',
    };

    const arrayKeys: Record<string, keyof Pick<User, 'speakerIds' | 'eventIds' | 'sessionIds' | 'socialLinks'>> = {
      'userSpeakerIds': 'speakerIds',
      'userEventIds': 'eventIds',
      'userSessionIds': 'sessionIds',
      'userSocialLinks': 'socialLinks'
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
      location: 'userLocation',
      phoneNumber: 'userPhoneNumber',
      bio: 'userBio',
      socialLinks: 'userSocialLinks',
      speakerIds: 'userSpeakerIds',
      eventIds: 'userEventIds',
      sessionIds: 'userSessionIds'
    };

    Object.entries(storageMapping).forEach(([userKey, storageKey]) => {
      const value = (user as any)[userKey];
      if (userKey === 'photoURL' && (!value || value.trim() === '')) {
        localStorage.removeItem(storageKey);
        return;
      }

      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          localStorage.setItem(storageKey, JSON.stringify(value));
        } else {
          localStorage.setItem(storageKey, value);
        }
      }
    });
  }

  updateUser(userData: Partial<User>): void {
    const currentUser = this.user();

    if ('photoURL' in userData && (!userData.photoURL || userData.photoURL.trim() === '')) {
      userData.photoURL = '';
    }

    const updatedUser = { ...currentUser, ...userData } as User;

    this.user.set(updatedUser);
    this.userSubject.next(updatedUser);
    this.saveToStorage();
  }

  clearUser(): void {
    this.user.set(null);
    this.userSubject.next(null);
    this.clearStorage();
  }

  private clearStorage(): void {
    const keysToRemove = [
      'userName', 'userPhotoURL', 'userEmail', 'userCompany',
      'userLocation', 'userPhoneNumber', 'userBio',
      'userSocialLinks',
      'userSpeakerIds', 'userEventIds', 'userSessionIds'
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}
