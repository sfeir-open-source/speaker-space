import { Component } from '@angular/core';
import {FormControl} from '@angular/forms';
import {AsyncPipe} from '@angular/common';
import {Observable} from 'rxjs';
import {InputComponent} from '../../../../shared/input/input.component';
import {ProfileService} from '../../service/profile.service';
import {FormField} from '../../../../shared/input/interface/form-field';

@Component({
  selector: 'app-personal-info',
  imports: [
    InputComponent,
    AsyncPipe
  ],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.scss'
})
export class PersonalInfoComponent {
  userPhotoURL$: Observable<string | null>;

  constructor(public profileService: ProfileService) {
    this.userPhotoURL$ = this.profileService.userPhotoURL$;
  }

  formFields: FormField[] = [
    {
      name: 'fullName',
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

  getFormControl(name: string): FormControl {
    return this.profileService.getForm().get(name) as FormControl;
  }

  handlePictureError(event: any) {
    event.target.src = 'img/profil-picture.svg';
  }
}
