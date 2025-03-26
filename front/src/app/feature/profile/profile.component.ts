import {Component} from '@angular/core';
import {ButtonWithIconComponent} from '../../shared/button-with-icon/button-with-icon.component';
import {Router} from '@angular/router';
import {FormField} from '../../shared/input/interface/form-field';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputComponent} from '../../shared/input/input.component';

@Component({
  selector: 'app-profile',
  imports: [
    ButtonWithIconComponent,
    InputComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  form: FormGroup;
  avatarPreviewUrl: string = 'https://via.placeholder.com/80';
  userPhotoURL: string | null = null;

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      fullName: [''],
      emailAddress: [''],
      company: [''],
      city: [''],
      avatarPictureURL: [''],
      phoneNumber: [''],
      biographySpeaker: ['']
    });

    this.form.get('avatarPictureURL')?.valueChanges.subscribe(url => {
      if (url && url.trim() !== '') {
        this.avatarPreviewUrl = url;
      } else {
        this.avatarPreviewUrl = 'https://via.placeholder.com/80';
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  formFields: FormField[] = [
    {
      name: 'fullName',
      label: 'Full name',
      placeholder: '',
      type: 'text',
    },
    {
      name: 'emailAddress',
      label: 'Email address',
      placeholder: '',
      type: 'text',
    },
    {
      name: 'company',
      label: 'Company',
      placeholder: '',
      type: 'text',
    },
    {
      name: 'city',
      label: 'City',
      placeholder: '',
      type: 'text',
    }
  ];

  additionalFields: FormField[] = [
    {
      name: 'avatarPictureURL',
      label: 'Avatar picture URL',
      placeholder: '',
      type: 'text',
    },
    {
      name: 'phoneNumber',
      label: 'Phone number',
      placeholder: '',
      type: 'tel',
    },
    {
      name: 'biographySpeaker',
      label: 'Biography Speaker',
      placeholder: '',
      type: 'textarea',
    },
    {
      name: 'otherlink',
      label: '',
      placeholder: '',
      type: 'text',
    }
  ];

  formLinkFields: FormField[] = [
    {
      name: 'fullName',
      label: 'Full name',
      placeholder: '',
      icon:'gite',
      type: 'text',
    },
    {
      name: 'emailAddress',
      label: 'Email address',
      placeholder: '',
      icon:'gite',
      type: 'text',
    },
    {
      name: 'company',
      label: 'Company',
      placeholder: '',
      icon:'gite',
      type: 'text',
    },
    {
      name: 'city',
      label: 'City',
      placeholder: '',
      icon:'gite',
      type: 'text',
    }
  ];

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
