import {Component, inject, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import {filter, startWith} from 'rxjs';
import {AuthService} from '../login/services/auth.service';
import {UserDataService} from '../services/user-services/user-data.service';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';

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
  private readonly router = inject(Router);

  readonly isHomePage = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => event.url === '/'),
      startWith(this.router.url === '/')
    ),
    { initialValue: this.router.url === '/' }
  );

  private readonly userSignal = toSignal(
    this.authService.user$.pipe(takeUntilDestroyed()),
    { initialValue: null }
  );

  readonly isLogin = computed(() => !!this.userSignal());
  readonly userName = computed(() => this.userSignal()?.displayName || null);
  readonly userPhotoURL = computed(() => this.userSignal()?.photoURL || null);
  readonly userEmail = computed(() => this.userSignal()?.email || null);

  haveNotification: boolean = true;

  handlePictureError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/img/profil-picture.svg';
  }

  openSidebar(): void {
    this.userDataService.toggleSidebar(true, {
      displayName: this.userName(),
      photoURL: this.userPhotoURL(),
      email: this.userEmail()
    });
  }
}
