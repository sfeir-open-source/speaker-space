import { Component, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { AuthService } from '../login/services/auth.service';
import { UserDataService } from '../services/user-services/user-data.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {UserStateService} from '../services/user-services/user-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly userDataService = inject(UserDataService);
  private readonly userState = inject(UserStateService);
  private readonly router = inject(Router);

  readonly isHomePage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.url === '/'),
      startWith(this.router.url === '/')
    ),
    { initialValue: this.router.url === '/' }
  );

  private readonly userSignal = toSignal(
    this.authService.user$.pipe(takeUntilDestroyed()),
    { initialValue: null }
  );

  readonly isLogin = computed(() => !!this.userSignal());
  readonly userName = computed(() => this.userState.name() || this.userSignal()?.displayName || null);
  readonly userPhotoURL = computed(() => {
    const statePhotoURL = this.userState.photoURL();
    return statePhotoURL || this.userSignal()?.photoURL || '';
  });
  readonly userEmail = computed(() => this.userSignal()?.email ?? null);

  haveNotification = true;

  constructor() {
    effect(() => {
      const isUserLoggedIn = this.isLogin();

      if (!isUserLoggedIn) {
        this.userDataService.toggleSidebar(false, null);
      }
    });
  }

  handlePictureError(event: Event): void {
    const target = event.target as HTMLImageElement;
    const defaultAvatar = 'assets/img/profil-picture.svg';
    if (target.src !== defaultAvatar) {
      target.src = defaultAvatar;
    }
  }

  openSidebar(): void {
    this.userDataService.toggleSidebar(true, {
      name: this.userName(),
      photoURL: this.userPhotoURL(),
      email: this.userEmail()
    });
  }
}
