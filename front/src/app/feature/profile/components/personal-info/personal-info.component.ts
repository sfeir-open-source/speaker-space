import { Component } from '@angular/core';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {ProfileService} from '../../../../core/services/profile.service';
import {InputComponent} from '../../../../shared/input/input.component';
import {AsyncPipe} from '@angular/common';
import {FormField} from '../../../../shared/input/interface/form-field';

@Component({
  selector: 'app-personal-info',
  standalone:true,
  templateUrl: './personal-info.component.html',
  imports: [
    InputComponent,
    AsyncPipe
  ],
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent {
  userPhotoURL$: Observable<string | null>;

  formFields: FormField[] = [
    { name: 'displayName', label: 'Full name', type: 'text' },
    { name: 'emailAddress', label: 'Email address', type: 'text' },
    { name: 'company', label: 'Company', type: 'text' },
    { name: 'city', label: 'City', type: 'text' }
  ];

  additionalFields: FormField[] = [
    { name: 'avatarPictureURL', label: 'Avatar picture URL', type: 'text' },
    { name: 'phoneNumber', label: 'Phone number', type: 'tel' }
  ];

  constructor(public profileService: ProfileService) {
    this.userPhotoURL$ = this.profileService.userPhotoURL$;
  }

  getFormControl(name: string): FormControl {
    return this.profileService.getForm().get(name) as FormControl;
  }

  handlePictureError(event: any): void {
    event.target.src = 'img/profil-picture.svg';
  }
}
