import { Injectable, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder, FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {UserStateService} from '../../../core/services/user-services/user-state.service';
import {AuthService} from '../../../core/login/services/auth.service';
import {environment} from '../../../../environments/environment.development';
import {SocialPlatformKey, User} from '../../../core/models/user.model';
import {SocialLinkMapperService} from './social-link-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private fb : FormBuilder = inject(FormBuilder);
  private http : HttpClient = inject(HttpClient);
  private userState : UserStateService = inject(UserStateService);
  private authService : AuthService = inject(AuthService);
  private socialLinkMapper = inject(SocialLinkMapperService);

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

  private initializeForm(): void {
    this.profileForm.patchValue({
      name: this.userState.name(),
      emailAddress: this.userState.email(),
      avatarPictureURL: this.userState.photoURL(),
      company: this.userState.company(),
      location: this.userState.location(),
      phoneNumber: this.userState.phoneNumber(),
      bio: this.userState.bio()
    });

    const socialLinks = this.userState.socialLinks();
    if (socialLinks && socialLinks.length > 0) {
      this.applySocialLinksMapping(socialLinks);
    }

    this.profileForm.get('avatarPictureURL')?.valueChanges.subscribe(url => {
      if (url) {
        this.userState.updateUser({ photoURL: url });
      }
    });
  }

  private createForm(): FormGroup {
    const urlPattern = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';
    const phonePattern = '^\\+?[0-9]{1,4}?[-.\\s]?\\(?[0-9]{1,3}?\\)?[-.\\s]?[0-9]{1,4}[-.\\s]?[0-9]{1,4}[-.\\s]?[0-9]{1,9}$';

    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      emailAddress: ['', [Validators.required, Validators.email]],
      company: ['', [this.conditionalValidator(Validators.minLength(2))]],
      location: ['', [this.conditionalValidator(Validators.minLength(2))]],
      avatarPictureURL: ['', [this.conditionalValidator(Validators.pattern(urlPattern))]],
      phoneNumber: ['', [this.conditionalValidator(Validators.pattern(phonePattern))]],
      bio: [''],
      socialLinks: this.fb.array([
        this.createSocialLinkControl(),
        this.createSocialLinkControl(),
        this.createSocialLinkControl(),
        this.createSocialLinkControl(),
        this.createSocialLinkControl(),
      ])    });
  }

  private createSocialLinkControl(): FormControl {
    const urlPattern = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';
    return this.fb.control('', [this.conditionalValidator(Validators.pattern(urlPattern))]);
  }

  getSocialLinksArray(): FormArray {
    return this.profileForm.get('socialLinks') as FormArray;
  }

  private conditionalValidator(validator: ValidatorFn): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value.trim() === '') {
        return null;
      }
      return validator(control);
    };
  }

  getForm(): FormGroup {
    return this.profileForm;
  }

  private async fetchUserData(uid: string): Promise<void> {
    try {
      const userData = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/user/${uid}`, { withCredentials: true })
      );

      if (userData) {
        this.userState.updateUser(userData);

        this.profileForm.patchValue({
          name: userData.name || '',
          emailAddress: userData.email || '',
          avatarPictureURL: userData.photoURL || '',
          company: userData.company || '',
          location: userData.location || '',
          phoneNumber: userData.phoneNumber || '',
          bio: userData.bio || ''
        }, { emitEvent: false });

        if (userData.socialLinks && userData.socialLinks.length > 0) {
          this.applySocialLinksMapping(userData.socialLinks);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  async savePartialProfile(partialData: Partial<User>): Promise<boolean> {
    if (!partialData.uid) return false;

    try {
      await this.authService.getIdToken(true);

      const response = await firstValueFrom(
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
    } catch (error) {
      console.error('Error saving partial profile:', error);
      return false;
    }
  }

  private applySocialLinksMapping(urls: string[]): void {
    const mapping = this.socialLinkMapper.mapUrlsToPlatforms(urls);
    const socialLinksArray = this.getSocialLinksArray();

    const platformOrder: SocialPlatformKey[] = ['github', 'twitter', 'bluesky', 'linkedin', 'other'];

    platformOrder.forEach((platform, index) => {
      if (index < socialLinksArray.length) {
        const url = mapping[platform] || '';
        socialLinksArray.at(index).setValue(url, { emitEvent: false });
      }
    });
  }
}
