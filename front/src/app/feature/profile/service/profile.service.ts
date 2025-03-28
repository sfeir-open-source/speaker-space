import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import {AuthService} from '../../../core/login/services/auth.service';
import {SidebarService} from '../../../core/sidebar/service/sidebar.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private userPhotoURLSubject = new BehaviorSubject<string | null>(null);
  userPhotoURL$ = this.userPhotoURLSubject.asObservable();

  private profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private sidebarService: SidebarService
  ) {
    this.profileForm = this.createForm();
    this.initializeUserData();
  }

  private createForm(): FormGroup {
    return this.fb.group({
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

  getForm(): FormGroup {
    return this.profileForm;
  }

  private initializeUserData(): void {
    this.userPhotoURLSubject.next(this.sidebarService.userPhotoURL || 'img/profil-picture.svg');

    this.authService.user$.subscribe(user => {
      if (user) {
        if (!this.sidebarService.userName && user.displayName) {
          this.sidebarService.userName = user.displayName;
        }
        if (!this.sidebarService.userEmail && user.email) {
          this.sidebarService.userEmail = user.email;
        }
        if (!this.sidebarService.userPhotoURL && user.photoURL) {
          this.sidebarService.userPhotoURL = user.photoURL;
        }

        this.profileForm.patchValue({
          fullName: user.displayName || this.sidebarService.userName || '',
          emailAddress: user.email || this.sidebarService.userEmail || '',
          avatarPictureURL: user.photoURL || this.sidebarService.userPhotoURL || ''
        });

        this.userPhotoURLSubject.next(
          user.photoURL || this.sidebarService.userPhotoURL || 'img/profil-picture.svg'
        );
      }
    });

    this.profileForm.get('avatarPictureURL')?.valueChanges.subscribe(url => {
      this.userPhotoURLSubject.next(url || 'img/profil-picture.svg');
    });
  }

  getPlaceholder(fieldName: string): string {
    switch(fieldName) {
      case 'fullName':
        return this.sidebarService.userName || 'Enter your name';
      case 'emailAddress':
        return this.sidebarService.userEmail || 'Enter your email';
      case 'avatarPictureURL':
        return this.sidebarService.userPhotoURL || 'Enter image URL';
      default:
        return '';
    }
  }

  saveProfile(): boolean {
    if (this.profileForm.valid) {
      this.sidebarService.userName = this.profileForm.value.fullName || this.sidebarService.userName;
      this.sidebarService.userEmail = this.profileForm.value.emailAddress || this.sidebarService.userEmail;
      this.sidebarService.userPhotoURL = this.profileForm.value.avatarPictureURL || this.sidebarService.userPhotoURL;
      return true;
    }
    return false;
  }
}
