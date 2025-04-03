import { Component, ElementRef, inject, OnInit, AfterViewInit, signal, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProfileSidebarComponent } from './components/profile-sidebar/profile-sidebar.component';
import { PersonalInfoComponent } from './components/personal-info/personal-info.component';
import { BiographyComponent } from './components/biography/biography.component';
import { SocialNetworksComponent } from './components/social-networks/social-networks.component';
import { NavbarProfileComponent } from './components/navbar-profile/navbar-profile.component';
import {CommonModule} from '@angular/common';
import {SaveIndicatorComponent} from './components/save-indicator/save-indicator.component';
import {SaveStatus} from './types/save-status.types';
import {ProfileService} from './services/profile.service';
import {UserStateService} from '../../core/services/user-services/user-state.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ProfileSidebarComponent,
    PersonalInfoComponent,
    BiographyComponent,
    SocialNetworksComponent,
    NavbarProfileComponent,
    CommonModule,
    SaveIndicatorComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  private profileService = inject(ProfileService);
  private elementRef = inject(ElementRef);
  private snackBar = inject(MatSnackBar);
  private userState = inject(UserStateService);
  private destroy$ = new Subject<void>();

  activeSection = signal('personal-info');
  saveStatus = signal<SaveStatus>('idle');

  profileForm = this.profileService.getForm();

  ngOnInit() {
    this.userState.loadFromStorage();
    this.setupAutoSave();
  }

  ngAfterViewInit() {
    this.setupSectionObserver();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupAutoSave() {
    this.profileForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(3000),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(() => {
        if (this.profileForm.dirty && this.profileForm.valid) {
          this.saveProfile();
        }
      });
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
          this.activeSection.set(entry.target.id);
        }
      });
    }, options);

    sections.forEach(id => {
      const element = this.elementRef.nativeElement.querySelector(`#${id}`);
      if (element) observer.observe(element);
    });
  }

  async saveProfile() {
    if (this.saveStatus() === 'saving') return;

    this.saveStatus.set('saving');
    try {
      const success = await this.profileService.saveProfile();

      if (success) {
        this.saveStatus.set('saved');
        setTimeout(() => {
          if (this.saveStatus() === 'saved') {
            this.saveStatus.set('idle');
          }
        }, 3000);
      } else {
        this.profileForm.markAllAsTouched();
        this.saveStatus.set('error');
        this.showErrorMessage('Please correct the errors in the form.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      this.saveStatus.set('error');
      this.showErrorMessage('An error occurred while saving your profile.');
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
