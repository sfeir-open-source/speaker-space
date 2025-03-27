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
  activeSection: string = 'personal-info';
  form: FormGroup;
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
      biographySpeaker: [''],
      github: [''],
      x: [''],
      bluesky: [''],
      linkedin: [''],
      otherlink: ['']
    });
  }


  navigateTo(path: string) {
    if (path.startsWith('#')) {
      const elementId = path.substring(1);
      const element = document.getElementById(elementId);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      this.router.navigate([path]);
    }
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
      icon:'link',
      type: 'text',
    }
  ];

  formLinkFields: FormField[] = [
    {
      name: 'github',
      label: '',
      placeholder: '',
      iconPath: '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" fill="#8e8e93"/>',
      type: 'text',
    },
    {
      name: 'x',
      label: '',
      placeholder: '',
      iconPath: '<svg  width="16" height="16" viewBox="0 0 22 22" ><path d="M13.3959 8.95772 19.6553 2h2.6902l-7.7936 8.6632 6.6261 9.7764 1.058 1.5611h-6.9162l-0.2975 -0.439 -4.4165 -6.5163L4.34651 22H1.65576l7.79418 -8.66 -6.62782 -9.77896L1.7641 2h6.91615l0.29751 0.43896 4.41814 6.51876Zm2.9845 11.04298L5.53571 4H7.6197l10.8447 16.0007h-2.084Z" fill="#8e8e93"/></svg>',
      type: 'text',
    },
    {
      name: 'bluesky',
      label: '',
      placeholder: '',
      iconPath: '<svg width="20" height="20" viewBox="0 0 26 26"><path d="M12 10.8c-1.087 -2.114 -4.046 -6.053 -6.798 -7.995C2.566 0.944 1.561 1.266 0.902 1.565 0.139 1.908 0 3.08 0 3.768c0 0.69 0.378 5.65 0.624 6.479 0.815 2.736 3.713 3.66 6.383 3.364 0.136 -0.02 0.275 -0.039 0.415 -0.056 -0.138 0.022 -0.276 0.04 -0.415 0.056 -3.912 0.58 -7.387 2.005 -2.83 7.078 5.013 5.19 6.87 -1.113 7.823 -4.308 0.953 3.195 2.05 9.271 7.733 4.308 4.267 -4.308 1.172 -6.498 -2.74 -7.078a8.741 8.741 0 0 1 -0.415 -0.056c0.14 0.017 0.279 0.036 0.415 0.056 2.67 0.297 5.568 -0.628 6.383 -3.364 0.246 -0.828 0.624 -5.79 0.624 -6.478 0 -0.69 -0.139 -1.861 -0.902 -2.206 -0.659 -0.298 -1.664 -0.62 -4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" fill="#8e8e93"/></svg>',
      type: 'text',
    },
    {
      name: 'linkedin',
      label: '',
      placeholder: '',
      iconPath: '<svg width="16" height="16" viewBox="0 0 310 310" fill="#8e8e93"><path d="M72.16,99.73H9.927c-2.762,0-5,2.239-5,5v199.928c0,2.762,2.238,5,5,5H72.16c2.762,0,5-2.238,5-5V104.73 C77.16,101.969,74.922,99.73,72.16,99.73z"></path><path d="M41.066,0.341C18.422,0.341,0,18.743,0,41.362C0,63.991,18.422,82.4,41.066,82.4 c22.626,0,41.033-18.41,41.033-41.038C82.1,18.743,63.692,0.341,41.066,0.341z"></path><path d="M230.454,94.761c-24.995,0-43.472,10.745-54.679,22.954V104.73c0-2.761-2.238-5-5-5h-59.599 c-2.762,0-5,2.239-5,5v199.928c0,2.762,2.238,5,5,5h62.097c2.762,0,5-2.238,5-5v-98.918c0-33.333,9.054-46.319,32.29-46.319 c25.306,0,27.317,20.818,27.317,48.034v97.204c0,2.762,2.238,5,5,5H305c2.762,0,5-2.238,5-5V194.995 C310,145.43,300.549,94.761,230.454,94.761z"></path></svg>',
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

  ngAfterViewInit() {
    this.setupSectionObserver();
  }

  setupSectionObserver() {
    const sections = ['personal-info', 'biography', 'social-networks'];

    const options = {
      root: null,
      rootMargin: '0px 0px -50% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.activeSection = entry.target.id;
        }
      });
    }, options);

    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
  }

  isActive(sectionId: string): boolean {
    return this.activeSection === sectionId.replace('#', '');
  }
}
