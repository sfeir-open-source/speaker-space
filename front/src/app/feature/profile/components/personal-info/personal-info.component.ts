import {Component, inject, effect} from '@angular/core';
import { FormControl } from '@angular/forms';
import {FieldComponent} from '../../../../shared/input/field.component';
import {FormField} from '../../../../shared/input/interface/form-field';
import {ProfileService} from '../../services/profile.service';
import {UserStateService} from '../../../../core/services/user-services/user-state.service';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  templateUrl: './personal-info.component.html',
  imports: [
    FieldComponent,
  ],
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent {
  private readonly profileService = inject(ProfileService);
  protected readonly userState = inject(UserStateService);

  readonly userPhotoURL = this.userState.photoURL;

  private readonly DEFAULT_AVATAR = 'assets/img/profil-picture.svg';

  constructor() {
    effect(() => {
      const photoURL = this.userPhotoURL();
      console.log('Photo URL changed:', photoURL);
    });
  }

  readonly formFields: FormField[] = [
    {
      name: 'name',
      label: 'Full name',
      type: 'text',
      isRequired: true,
      errorMessage: 'Please enter your full name (minimum 2 characters)'
    },
    {
      name: 'emailAddress',
      label: 'Email address',
      type: 'email',
      isRequired: true,
      errorMessage: 'Please enter a valid email address'
    },
    {
      name: 'company',
      label: 'Company',
      type: 'text',
      isRequired: false,
      errorMessage: 'Company name must be at least 2 characters'
    },
    {
      name: 'location',
      label: 'City',
      type: 'text',
      isRequired: false,
      errorMessage: 'City name must be at least 2 characters'
    }
  ];

  readonly additionalFields: FormField[] = [
    {
      name: 'avatarPictureURL',
      label: 'Avatar picture URL',
      type: 'text',
      isRequired: false,
      errorMessage: 'Please enter a valid URL'
    },
    {
      name: 'phoneNumber',
      label: 'Phone number',
      type: 'text',
      isRequired: false,
      errorMessage: 'Please enter a valid phone number (e.g., +33 6 12 34 56 78, 0612345678)'
    }
  ];

  getFormControl(name: string): FormControl {
    return this.profileService.getForm().get(name) as FormControl;
  }

  handlePictureError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src !== this.DEFAULT_AVATAR) {
      target.src = this.DEFAULT_AVATAR;
    }
  }
}
