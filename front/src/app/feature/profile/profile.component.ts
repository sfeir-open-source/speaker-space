import {AfterViewInit, Component, ElementRef, OnInit} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ProfileSidebarComponent} from './components/profile-sidebar/profile-sidebar.component';
import {PersonalInfoComponent} from './components/personal-info/personal-info.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ProfileService} from '../../core/services/profile.service';
import {BiographyComponent} from './components/biography/biography.component';
import {SocialNetworksComponent} from './components/social-networks/social-networks.component';
import {NavbarProfileComponent} from './components/navbar-profile/navbar-profile.component';

@Component({
  selector: 'app-profile',
  standalone:true,
  imports: [
    ReactiveFormsModule,
    ProfileSidebarComponent,
    PersonalInfoComponent,
    BiographyComponent,
    SocialNetworksComponent,
    NavbarProfileComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, AfterViewInit {
  activeSection: string = 'personal-info';
  profileForm: FormGroup;
  isSubmitting = false;

  constructor(
    private profileService: ProfileService,
    private elementRef: ElementRef,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.profileService.getForm();
  }

  ngOnInit() {
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
      const element = this.elementRef.nativeElement.querySelector(`#${id}`);
      if (element) observer.observe(element);
    });
  }

  async onSubmit() {
    if (this.isSubmitting) return;
    console.log('Form submitted, values:', this.profileForm.value);

    this.isSubmitting = true;
    try {
      console.log('Calling saveProfile()');

      const success = await this.profileService.saveProfile();
      console.log('saveProfile() result:', success);

      if (success) {
        this.showSuccessMessage('Profile updated successfully!');
      } else {
        this.profileForm.markAllAsTouched();
        this.showErrorMessage('Please correct the errors in the form.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      this.showErrorMessage('An error occurred while saving your profile.');
    } finally {
      this.isSubmitting = false;
    }
  }

  showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showErrorMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
