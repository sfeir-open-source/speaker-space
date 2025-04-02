import { Injectable } from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import {AuthService} from './auth.service';
import {FormField} from '../../shared/input/interface/form-field';
import {environment} from '../../../environments/environment.development';
import {HttpClient} from '@angular/common/http';
import {UserDataService} from './user-data.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private userPhotoURLSubject = new BehaviorSubject<string | null>(null);
  userPhotoURL$ = this.userPhotoURLSubject.asObservable();

  private profileForm: FormGroup;
  private currentUserUid: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userDataService: UserDataService,
    private http: HttpClient
  ) {
    this.profileForm = this.createForm();
    this.initializeUserData();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      displayName: [''],
      emailAddress: [''],
      company: [''],
      city: [''],
      avatarPictureURL: [''],
      phoneNumber: [''],
      biographySpeaker: [''],
      githubLink: [''],
      twitterLink: [''],
      blueSkyLink: [''],
      linkedInLink: [''],
      otherlink: ['']
    });
  }

  getForm(): FormGroup {
    return this.profileForm;
  }

  private initializeUserData(): void {
    this.userPhotoURLSubject.next(this.userDataService.userPhotoURL || 'img/profil-picture.svg');

    this.authService.user$.subscribe(user => {
      if (user) {
        this.currentUserUid = user.uid;
        console.log('Current user UID set:', this.currentUserUid);

        this.profileForm.patchValue({
          displayName: user.displayName || this.userDataService.userName || '',
          emailAddress: user.email || this.userDataService.userEmail || '',
          avatarPictureURL: user.photoURL || this.userDataService.userPhotoURL || ''
        });

        this.userPhotoURLSubject.next(
          user.photoURL || this.userDataService.userPhotoURL || 'img/profil-picture.svg'
        );

        this.fetchUserDataFromFirestore(user.uid);
      }
    });

    this.profileForm.get('avatarPictureURL')?.valueChanges.subscribe(url => {
      this.userPhotoURLSubject.next(url || 'img/profil-picture.svg');
    });
  }

  private fetchUserDataFromFirestore(uid: string): void {
    console.log('Fetching user data from Firestore for UID:', uid);

    this.http.get<any>(`${environment.apiUrl}/auth/user/${uid}`, { withCredentials: true })
      .subscribe({
        next: (userData) => {
          console.log('User data received from Firestore:', userData);

          if (userData) {
            this.profileForm.patchValue({
              company: userData.company || '',
              city: userData.city || '',
              phoneNumber: userData.phoneNumber || '',
              githubLink: userData.githubLink || '',
              twitterLink: userData.twitterLink || '',
              blueSkyLink: userData.blueSkyLink || '',
              linkedInLink: userData.linkedInLink || ''
            });

            this.userDataService.userCompany = userData.company || this.userDataService.userCompany;
            this.userDataService.userCity = userData.city || this.userDataService.userCity;
            this.userDataService.userPhoneNumber = userData.phoneNumber || this.userDataService.userPhoneNumber;
            this.userDataService.userGithubLink = userData.githubLink || this.userDataService.userGithubLink;
            this.userDataService.userTwitterLink = userData.twitterLink || this.userDataService.userTwitterLink;
            this.userDataService.userBlueSkyLink = userData.blueSkyLink || this.userDataService.userBlueSkyLink;
            this.userDataService.userLinkedInLink = userData.linkedInLink || this.userDataService.userLinkedInLink;

            console.log('UserDataService updated with Firestore data');
          }
        },
        error: (error) => {
          console.error('Error fetching user data from Firestore:', error);
        }
      });
  }


  getPlaceholder(fieldName: string): string {
    switch (fieldName) {
      case 'displayName':
        return this.userDataService.userName || '';
      case 'emailAddress':
        return this.userDataService.userEmail || '';
      case 'avatarPictureURL':
        return this.userDataService.userPhotoURL || '';
      case 'company':
        return this.userDataService.userCompany || '';
      case 'city':
        return this.userDataService.userCity || '';
      case 'phoneNumber':
        return this.userDataService.userPhoneNumber || '';
      case 'githubLink':
        return this.userDataService.userGithubLink || '';
      case 'twitterLink':
        return this.userDataService.userTwitterLink || '';
      case 'blueSkyLink':
        return this.userDataService.userBlueSkyLink || '';
      case 'linkedInLink':
        return this.userDataService.userLinkedInLink || '';
      default:
        return '';
    }
  }

  async saveProfile(): Promise<boolean> {
    console.log('Saving profile, currentUserUid:', this.currentUserUid);
    console.log('Form values:', this.profileForm.value);

    if (!this.currentUserUid) {
      console.error('No user UID available');
      return false;
    }

    try {
      await this.authService.getIdToken(true);

      const userData = {
        uid: this.currentUserUid,
        displayName: this.profileForm.value.displayName,
        photoURL: this.profileForm.value.avatarPictureURL,
        company: this.profileForm.value.company,
        city: this.profileForm.value.city,
        phoneNumber: this.profileForm.value.phoneNumber,
        githubLink: this.profileForm.value.githubLink,
        twitterLink: this.profileForm.value.twitterLink,
        blueSkyLink: this.profileForm.value.blueSkyLink,
        linkedInLink: this.profileForm.value.linkedInLink,
      };

      console.log('Sending user data to backend:', userData);

      const response = await firstValueFrom(
        this.http.put<any>(`${environment.apiUrl}/auth/profile`, userData, {withCredentials: true})
      );

      console.log('Profile saved successfully, response:', response);

      this.userDataService.userName = userData.displayName || this.userDataService.userName;
      this.userDataService.userPhotoURL = userData.photoURL || this.userDataService.userPhotoURL;
      this.userDataService.userCompany = userData.company || this.userDataService.userCompany;
      this.userDataService.userCity = userData.city || this.userDataService.userCity;
      this.userDataService.userPhoneNumber = userData.phoneNumber || this.userDataService.userPhoneNumber;
      this.userDataService.userGithubLink = userData.githubLink || this.userDataService.userGithubLink;
      this.userDataService.userTwitterLink = userData.twitterLink || this.userDataService.userTwitterLink;
      this.userDataService.userBlueSkyLink = userData.blueSkyLink || this.userDataService.userBlueSkyLink;
      this.userDataService.userLinkedInLink = userData.linkedInLink || this.userDataService.userLinkedInLink;

      localStorage.setItem('userDisplayName', userData.displayName || '');
      localStorage.setItem('userPhotoURL', userData.photoURL || '');
      localStorage.setItem('userCompany', userData.company || '');
      localStorage.setItem('userCity', userData.city || '');
      localStorage.setItem('userPhoneNumber', userData.phoneNumber || '');
      localStorage.setItem('userGithubLink', userData.githubLink || '');
      localStorage.setItem('userTwitterLink', userData.twitterLink || '');
      localStorage.setItem('userBlueSkyLink', userData.blueSkyLink || '');
      localStorage.setItem('userLinkedInLink', userData.linkedInLink || '');

      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
    }
  }
}

export class PersonalInfoComponent {
  userPhotoURL$: Observable<string | null>;

  constructor(public profileService: ProfileService) {
    this.userPhotoURL$ = this.profileService.userPhotoURL$;
  }

  formFields: FormField[] = [
    {
      name: 'displayName',
      label: 'Full name',
      type: 'text',
    },
    {
      name: 'emailAddress',
      label: 'Email address',
      type: 'text',
    },
    {
      name: 'company',
      label: 'Company',
      type: 'text',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
    }
  ];

  additionalFields: FormField[] = [
    {
      name: 'avatarPictureURL',
      label: 'Avatar picture URL',
      type: 'text',
    },
    {
      name: 'phoneNumber',
      label: 'Phone number',
      type: 'tel',
    }
  ];
}
