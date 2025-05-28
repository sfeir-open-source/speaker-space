import { Component, ElementRef, inject, OnInit, AfterViewInit, signal, OnDestroy } from '@angular/core';
import { ReactiveFormsModule} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
  private profileService :ProfileService = inject(ProfileService);
  private elementRef : ElementRef= inject(ElementRef);
  private snackBar : MatSnackBar = inject(MatSnackBar);
  private userState : UserStateService = inject(UserStateService);
  private destroy$ : Subject<void> = new Subject<void>();

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
        if (this.profileForm.dirty) {
          this.saveProfile();
        }
      });
  }

  setupSectionObserver() {
    const sections : string[] = ['personal-info', 'biography', 'social-networks'];
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
      const element : any = this.elementRef.nativeElement.querySelector(`#${id}`);
      if (element) observer.observe(element);
    });
  }

  async saveProfile() {
    if (this.saveStatus() === 'saving') return;

    this.saveStatus.set('saving');

    try {
      const validFields : Partial<User> = this.extractValidFields();
      const success : boolean = await this.profileService.savePartialProfile(validFields);

      if (success) {
        this.saveStatus.set('saved');
        setTimeout(() => {
          if (this.saveStatus() === 'saved') {
            this.saveStatus.set('idle');
          }
        }, 3000);
      } else {
        this.saveStatus.set('error');
        this.showErrorMessage('Erreur lors de la sauvegarde.');
      }
    } catch (error) {
      this.saveStatus.set('error');
      this.showErrorMessage('Une erreur est survenue lors de la sauvegarde.');
    }
  }

  private extractValidFields(): Partial<User> {
    const user : User | null = this.userState.user();
    const result: Partial<User> = { uid: user?.uid, email: user?.email };

    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      if (control && control.valid && control.value !== null) {
        const fieldMapping: Record<string, string> = {
          'avatarPictureURL': 'photoURL',
          'emailAddress': 'email'
        };

        const userField : string = fieldMapping[key] || key;
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
