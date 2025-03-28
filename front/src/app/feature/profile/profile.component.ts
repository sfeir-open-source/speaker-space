import {AfterViewInit, Component, ElementRef, OnInit, Renderer2} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ProfileService} from './service/profile.service';
import {ProfileSidebarComponent} from './components/profile-sidebar/profile-sidebar.component';
import {PersonalInfoComponent} from './components/personal-info/personal-info.component';
import {BiographyComponent} from './components/biography/biography.component';
import {SocialNetworksComponent} from './components/social-networks/social-networks.component';
import {NavbarProfileComponent} from './components/navbar-profile/navbar-profile.component';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    NavbarProfileComponent,
    ProfileSidebarComponent,
    PersonalInfoComponent,
    BiographyComponent,
    SocialNetworksComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, AfterViewInit {
  activeSection: string = 'personal-info';
  profileForm: FormGroup;

  constructor(
    private profileService: ProfileService,
    private renderer: Renderer2,
    private elementRef: ElementRef
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

  onSubmit() {
    if (this.profileService.saveProfile()) {
      this.showSuccessMessage('Profile updated successfully!');
    } else {
      this.profileForm.markAllAsTouched();
      this.showErrorMessage('Please correct the errors in the form.');
    }
  }

  showSuccessMessage(message: string) {
    alert(message);
  }

  showErrorMessage(message: string) {
    alert(message);
  }
}
