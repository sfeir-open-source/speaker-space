import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {InputComponent} from '../../../../shared/input/input.component';
import {FormField} from '../../../../shared/input/interface/form-field';
import {ProfileService} from '../../services/profile.service';
import {UserStateService} from '../../../../core/services/user-services/user-state.service';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  templateUrl: './personal-info.component.html',
  imports: [
    InputComponent,
  ],
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent {
  private profileService = inject(ProfileService);
  private userState = inject(UserStateService);

  userPhotoURL = this.userState.photoURL;

  formFields: FormField[] = [
    { name: 'displayName', label: 'Full name', type: 'text' },
    { name: 'emailAddress', label: 'Email address', type: 'text' },
    { name: 'company', label: 'Company', type: 'text' },
    { name: 'city', label: 'City', type: 'text' }
  ];

  additionalFields: FormField[] = [
    { name: 'avatarPictureURL', label: 'Avatar picture URL', type: 'text' },
    { name: 'phoneNumber', label: 'Phone number', type: 'text' }
  ];

  getFormControl(name: string): FormControl {
    return this.profileService.getForm().get(name) as FormControl;
  }

  handlePictureError(event: any): void {
    event.target.src = 'img/profil-picture.svg';
  }
}
