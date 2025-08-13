import {Component, ElementRef, inject, OnInit, AfterViewInit, signal, OnDestroy, DestroyRef} from '@angular/core';
import { ReactiveFormsModule} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {Subject, debounceTime, distinctUntilChanged, firstValueFrom} from 'rxjs';
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
import {UserSpeakerService} from '../../core/services/user-services/user-speaker.service';

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
  private userSpeakerService = inject(UserSpeakerService);
  private elementRef = inject(ElementRef);
  private snackBar = inject(MatSnackBar);
  protected userState = inject(UserStateService);
  private destroy$ = new Subject<void>();
  private readonly _destroyRef = inject(DestroyRef);

  activeSection = signal('personal-info');
  saveStatus = signal<SaveStatus>('idle');
  syncingAll = signal(false);

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
    const sections: string[] = ['personal-info', 'biography', 'social-networks'];
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
      const element: any = this.elementRef.nativeElement.querySelector(`#${id}`);
      if (element) observer.observe(element);
    });
  }

  async syncAllSpeakerData() {
    if (this.syncingAll()) return;

    this.syncingAll.set(true);

    try {
      const eventIds = this.userState.eventIds();

      if (eventIds.length === 0) {
        this.showInfoMessage('No speaker events found to sync');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const eventId of eventIds) {
        try {
          await firstValueFrom(this.userSpeakerService.syncSpeakerData(eventId));
          successCount++;
        } catch (error) {
          console.error(`Failed to sync data for event ${eventId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        this.showSuccessMessage(
          `Synchronization successful for ${successCount} event(s)`
        );

        await this.reloadUserData();
      }

      if (errorCount > 0) {
        this.showWarningMessage(
          `${errorCount} event(s) could not be synchronized`
        );
      }

    } catch (error) {
      console.error('Error during speaker data sync:', error);
      this.showErrorMessage('Error synchronizing speaker data');
    } finally {
      this.syncingAll.set(false);
    }
  }

  private async reloadUserData() {
    const currentUser = this.userState.user();
    if (currentUser?.uid) {
      try {
        await this.profileService.fetchUserData(currentUser.uid);
      } catch (error) {
        console.error('Error reloading user data:', error);
      }
    }
  }

  async saveProfile() {
    if (this.saveStatus() === 'saving') return;

    this.saveStatus.set('saving');

    try {
      const validFields: Partial<User> = this.extractValidFields();
      const success: boolean = await this.profileService.savePartialProfile(validFields);

      if (success) {
        this.saveStatus.set('saved');
        setTimeout(() => {
          if (this.saveStatus() === 'saved') {
            this.saveStatus.set('idle');
          }
        }, 3000);
      } else {
        this.saveStatus.set('error');
        this.showErrorMessage('Error while saving');
      }
    } catch (error) {
      this.saveStatus.set('error');
      this.showErrorMessage('An error occurred while saving\n');
    }
  }

  private extractValidFields(): Partial<User> {
    const user: User | null = this.userState.user();
    const result: Partial<User> = { uid: user?.uid, email: user?.email };

    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      if (control && control.valid && control.value !== null) {
        const fieldMapping: Record<string, string> = {
          'avatarPictureURL': 'photoURL',
          'emailAddress': 'email'
        };

        const userField: string = fieldMapping[key] || key;
        result[userField as keyof User] = control.value;
      }
    });

    return result;
  }

  private showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private showInfoMessage(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  private showWarningMessage(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['warning-snackbar']
    });
  }

  showErrorMessage(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
