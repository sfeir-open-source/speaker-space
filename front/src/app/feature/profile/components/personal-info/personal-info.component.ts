import {Component, inject, Signal} from '@angular/core';
import { FormControl } from '@angular/forms';
import {InputComponent} from '../../../../shared/input/input.component';
import {FormField} from '../../../../shared/input/interface/form-field';
import {ProfileService} from '../../services/profile.service';
import {UserStateService} from '../../../../core/services/user-services/user-state.service';
import {ImageUploadConfig, ImageUploadResult} from '../../../../shared/image-upload/image-upload.type';
import {ImageUploadComponent} from '../../../../shared/image-upload/image-upload/image-upload.component';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  templateUrl: './personal-info.component.html',
  imports: [
    InputComponent,
    ImageUploadComponent,
  ],
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent {
  private profileService: ProfileService = inject(ProfileService);
  private userState: UserStateService = inject(UserStateService);

  userPhotoURL: Signal<string> = this.userState.photoURL;

  avatarUploadConfig: ImageUploadConfig = {
    title: 'Profile picture',
    description: 'Upload your profile picture.',
    acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    maxFileSize: 300 * 1024,
    recommendedSize: '500x500',
    maxSizeText: '300kB max',
    optimizationLink: 'https://squoosh.app',
    width: 'w-20',
    height: 'h-20',
    shape: 'square'
  };

  formFields: FormField[] = [
    { name: 'displayName', label: 'Full name', type: 'text' },
    { name: 'emailAddress', label: 'Email address', type: 'email' },
    { name: 'company', label: 'Company', type: 'text' },
    { name: 'city', label: 'City', type: 'text' }
  ];

  additionalFields: FormField[] = [
    { name: 'phoneNumber', label: 'Phone number', type: 'text' }
  ];

  getFormControl(name: string): FormControl {
    return this.profileService.getForm().get(name) as FormControl;
  }

  onAvatarSelected(result: ImageUploadResult): void {
    const avatarControl = this.getFormControl('avatarPictureURL');
    avatarControl.setValue(result.base64);
    avatarControl.markAsTouched();
  }

  onAvatarRemoved(): void {
    const avatarControl = this.getFormControl('avatarPictureURL');
    avatarControl.setValue('');
    avatarControl.markAsTouched();
  }

  handlePictureError(event: any): void {
    event.target.src = 'img/profil-picture.svg';
  }
}

