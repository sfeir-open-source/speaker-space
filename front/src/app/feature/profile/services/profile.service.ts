import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {UserStateService} from '../../../core/services/user-services/user-state.service';
import {AuthService} from '../../../core/login/services/auth.service';
import {environment} from '../../../../environments/environment.development';
import {User} from '../../../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private userState = inject(UserStateService);
  private authService = inject(AuthService);

  private profileForm: FormGroup;

  constructor() {
    this.profileForm = this.createForm();
    this.initializeForm();

    this.authService.user$.subscribe(user => {
      if (user) {
        this.fetchUserData(user.uid);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      displayName: [''],
      emailAddress: ['', [Validators.email]],
      company: [''],
      city: [''],
      avatarPictureURL: [''],
      phoneNumber: [''],
      biography: [''],
      githubLink: [''],
      twitterLink: [''],
      blueSkyLink: [''],
      linkedInLink: [''],
      otherLink: ['']
    });
  }

  private initializeForm(): void {
    this.profileForm.patchValue({
      displayName: this.userState.displayName(),
      emailAddress: this.userState.email(),
      avatarPictureURL: this.userState.photoURL(),
      company: this.userState.company(),
      city: this.userState.city(),
      phoneNumber: this.userState.phoneNumber(),
      githubLink: this.userState.githubLink(),
      twitterLink: this.userState.twitterLink(),
      blueSkyLink: this.userState.blueSkyLink(),
      linkedInLink: this.userState.linkedInLink(),
      otherLink: this.userState.otherLink(),
      biography: this.userState.biography()
    });

    this.profileForm.get('avatarPictureURL')?.valueChanges.subscribe(url => {
      if (url) {
        this.userState.updateUser({ photoURL: url });
      }
    });
  }

  getForm(): FormGroup {
    return this.profileForm;
  }

  getPlaceholder(fieldName: string): string {
    switch (fieldName) {
      case 'displayName': return this.userState.displayName();
      case 'emailAddress': return this.userState.email();
      case 'avatarPictureURL': return this.userState.photoURL();
      case 'company': return this.userState.company();
      case 'city': return this.userState.city();
      case 'phoneNumber': return this.userState.phoneNumber();
      case 'githubLink': return this.userState.githubLink();
      case 'twitterLink': return this.userState.twitterLink();
      case 'blueSkyLink': return this.userState.blueSkyLink();
      case 'linkedInLink': return this.userState.linkedInLink();
      case 'otherLink': return this.userState.otherLink();
      case 'biography': return this.userState.biography();
      default: return '';
    }
  }

  private async fetchUserData(uid: string): Promise<void> {
    try {
      const userData = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/user/${uid}`, { withCredentials: true })
      );

      if (userData) {
        this.userState.updateUser(userData);

        this.profileForm.patchValue({
          displayName: userData.displayName || '',
          emailAddress: userData.email || '',
          avatarPictureURL: userData.photoURL || '',
          company: userData.company || '',
          city: userData.city || '',
          phoneNumber: userData.phoneNumber || '',
          githubLink: userData.githubLink || '',
          twitterLink: userData.twitterLink || '',
          blueSkyLink: userData.blueSkyLink || '',
          linkedInLink: userData.linkedInLink || '',
          otherLink: userData.otherLink || '',
          biography: userData.biography || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  async saveProfile(): Promise<boolean> {
    const user = this.userState.user();
    if (!user?.uid) return false;

    try {
      await this.authService.getIdToken(true);

      const formValues = this.profileForm.value;
      const userData: Partial<User> = {
        uid: user.uid,
        displayName: formValues.displayName,
        photoURL: formValues.avatarPictureURL,
        company: formValues.company,
        city: formValues.city,
        phoneNumber: formValues.phoneNumber,
        githubLink: formValues.githubLink,
        twitterLink: formValues.twitterLink,
        blueSkyLink: formValues.blueSkyLink,
        linkedInLink: formValues.linkedInLink,
        biography: formValues.biography,
        otherLink: formValues.otherLink
      };

      await firstValueFrom(
        this.http.put<any>(`${environment.apiUrl}/auth/profile`, userData, { withCredentials: true })
      );

      this.userState.updateUser(userData);

      this.userState.saveToStorage();

      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
    }
  }
}
