import { Injectable, inject } from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
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
  private fb : FormBuilder = inject(FormBuilder);
  private http : HttpClient = inject(HttpClient);
  private userState : UserStateService = inject(UserStateService);
  private authService : AuthService = inject(AuthService);

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
    const urlPattern = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';

    return this.fb.group({
      name: ['', [Validators.minLength(2)]],
      emailAddress: ['', [Validators.required, Validators.email]],
      company: ['', [this.conditionalValidator(Validators.minLength(2))]],
      location: ['', [this.conditionalValidator(Validators.minLength(2))]],
      avatarPictureURL: ['', [this.conditionalValidator(Validators.pattern(urlPattern))]],
      phoneNumber: ['', [this.conditionalValidator(Validators.pattern('^(\\+?[0-9\\s.-]{6,})?$'))]],
      bio: [''],
      socialLink: ['', [this.conditionalValidator(Validators.pattern(urlPattern))]],
    });
  }

  private conditionalValidator(validator: ValidatorFn): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value.trim() === '') {
        return null;
      }
      return validator(control);
    };
  }

  private initializeForm(): void {
    this.profileForm.patchValue({
      name: this.userState.name(),
      emailAddress: this.userState.email(),
      avatarPictureURL: this.userState.photoURL(),
      company: this.userState.company(),
      location: this.userState.location(),
      phoneNumber: this.userState.phoneNumber(),
      socialLink: this.userState.socialLink(),
      bio: this.userState.bio()
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

  private async fetchUserData(uid: string): Promise<void> {
    try {
      const userData: User = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/user/${uid}`, { withCredentials: true })
      );

      if (userData) {
        this.userState.updateUser(userData);

        this.profileForm.patchValue({
          displayName: userData.name || '',
          emailAddress: userData.email || '',
          avatarPictureURL: userData.photoURL || '',
          company: userData.company || '',
          location: userData.location || '',
          phoneNumber: userData.phoneNumber || '',
          socialLink: userData.socialLink || '',
          bio: userData.bio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  async savePartialProfile(partialData: Partial<User>): Promise<boolean> {
    if (!partialData.uid) return false;

    try {
      await this.authService.getIdToken(true);

      const response: User = await firstValueFrom(
        this.http.put<User>(`${environment.apiUrl}/auth/profile`, partialData, {
          withCredentials: true
        })
      );

      if (response) {
        this.userState.updateUser(partialData);
        this.userState.saveToStorage();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error saving partial profile:', error);
      return false;
    }
  }
}
