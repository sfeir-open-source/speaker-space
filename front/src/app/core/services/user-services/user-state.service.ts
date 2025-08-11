import {computed, Injectable, signal} from '@angular/core';
import {User} from '../../models/user.model';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  // Signals pour un accès réactif
  user = signal<User | null>(null);
  displayName = computed(() => this.user()?.displayName || '');
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

  // Nouveaux champs pour la liaison speaker
  speakerIds = computed(() => this.user()?.speakerIds || []);
  eventIds = computed(() => this.user()?.eventIds || []);
  sessionIds = computed(() => this.user()?.sessionIds || []);

  // Computed pour vérifier les rôles
  hasSpeakerRole = computed(() => this.eventIds().length > 0);

  loadFromStorage(): void {
    const userData: Partial<User> = {};

    // Définition des mappings avec types explicites
    const stringKeys: Record<string, keyof Pick<User, 'displayName' | 'photoURL' | 'email' | 'company' | 'city' | 'phoneNumber' | 'githubLink' | 'twitterLink' | 'blueSkyLink' | 'linkedInLink' | 'otherLink' | 'biography'>> = {
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

    const arrayKeys: Record<string, keyof Pick<User, 'speakerIds' | 'eventIds' | 'sessionIds'>> = {
      'userSpeakerIds': 'speakerIds',
      'userEventIds': 'eventIds',
      'userSessionIds': 'sessionIds'
    };

    // Traitement des champs string
    Object.entries(stringKeys).forEach(([storageKey, userKey]) => {
      const value = localStorage.getItem(storageKey);
      if (value) {
        (userData as any)[userKey] = value;
      }
    });

    // Traitement des champs array
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
      displayName: 'userDisplayName',
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
    const updatedUser = { ...currentUser, ...userData } as User;

    this.user.set(updatedUser);
    this.userSubject.next(updatedUser);
  }

  clearUser(): void {
    this.user.set(null);
    this.userSubject.next(null);
    this.clearStorage();
  }

  private clearStorage(): void {
    const keysToRemove = [
      'userDisplayName', 'userPhotoURL', 'userEmail', 'userCompany',
      'userCity', 'userPhoneNumber', 'userGithubLink', 'userTwitterLink',
      'userBlueSkyLink', 'userLinkedInLink', 'userOtherLink', 'userBiography',
      'userSpeakerIds', 'userEventIds', 'userSessionIds'
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}
