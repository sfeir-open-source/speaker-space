import {Component, ElementRef, inject, OnInit, AfterViewInit, signal, OnDestroy, DestroyRef} from '@angular/core';
import {FormArray, ReactiveFormsModule} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProfileSidebarComponent } from './components/profile-sidebar/profile-sidebar.component';
import { PersonalInfoComponent } from './components/personal-info/personal-info.component';
import { BiographyComponent } from './components/biography/biography.component';
import { SocialNetworksComponent } from './components/social-networks/social-networks.component';
import { NavbarProfileComponent } from './components/navbar-profile/navbar-profile.component';
import {CommonModule} from '@angular/common';
import {ProfileService} from './services/profile.service';
import {UserStateService} from '../../core/services/user-services/user-state.service';
import {User} from '../../core/models/user.model';
import {SaveIndicatorComponent} from '../../core/save-indicator/save-indicator.component';
import {SaveStatus} from '../../core/types/save-status.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ButtonComponent} from '../../shared/button/button.component';

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
    SaveIndicatorComponent,
    ButtonComponent
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
  private readonly _destroyRef = inject(DestroyRef);

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
        takeUntilDestroyed(this._destroyRef),
        debounceTime(3000),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(() => {
        if (this.profileForm.dirty) {
          this.saveProfile();
        }
      });
  }

  setupSectionObserver() {
    const sections = ['personal-info', 'bio', 'social-networks'];
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

    const nameControl = this.profileForm.get('name');
    const emailControl = this.profileForm.get('emailAddress');

    if (!nameControl?.value || nameControl.value.trim() === '') {
      this.saveStatus.set('error');
      this.showErrorMessage('Full name is required');
      nameControl?.markAsTouched();
      return;
    }

    if (!emailControl?.value || emailControl.invalid) {
      this.saveStatus.set('error');
      this.showErrorMessage('A valid email address is required');
      emailControl?.markAsTouched();
      return;
    }

    this.saveStatus.set('saving');

    try {
      const validFields = this.extractValidFields();
      const success = await this.profileService.savePartialProfile(validFields);

      if (success) {
        this.saveStatus.set('saved');
        setTimeout(() => {
          if (this.saveStatus() === 'saved') {
            this.saveStatus.set('idle');
          }
        }, 3000);
      } else {
        this.saveStatus.set('error');
        this.showErrorMessage('Error saving profile.');
      }
    } catch (error) {
      this.saveStatus.set('error');
      this.showErrorMessage('An error occurred while saving.');
    }
  }

  private extractValidFields(): Partial<User> {
    const user = this.userState.user();
    const result: Partial<User> = { uid: user?.uid, email: user?.email };

    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);

      if (key === 'socialLinks') {
        const socialLinksArray = control as FormArray;
        const validLinks = socialLinksArray.controls
          .map(ctrl => ctrl.value)
          .filter((link: string) => link && link.trim() !== '');

        if (validLinks.length > 0) {
          result.socialLinks = validLinks;
        }
        return;
      }

      if (control && control.valid && control.value !== null && control.value !== '') {
        const fieldMapping: Record<string, string> = {
          'avatarPictureURL': 'photoURL',
          'emailAddress': 'email'
        };

        const userField = fieldMapping[key] || key;
        result[userField as keyof User] = control.value;
      }
    });

    return result;
  }

  showErrorMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
