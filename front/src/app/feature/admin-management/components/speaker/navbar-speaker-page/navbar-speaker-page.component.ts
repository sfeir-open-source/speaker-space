import { Component, input, computed, effect, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../../core/login/services/auth.service';
import { UserRoleService } from '../../../services/team/user-role.service';
import { NavbarAdminPageComponent } from '../../navbar-admin-page/navbar-admin-page.component';
import { NavbarConfig } from '../../../type/components/navbar-config';

@Component({
  selector: 'app-navbar-speaker-page',
  standalone: true,
  imports: [
    NavbarAdminPageComponent,
  ],
  templateUrl: './navbar-speaker-page.component.html',
  styleUrl: './navbar-speaker-page.component.scss'
})
export class NavbarSpeakerPageComponent {
  eventId = input<string>('');
   eventUrl = input<string>('');
   eventName = input<string>('');
   userRole = input<string>('');
   speakerEmail = input<string>('');

  private  router = inject(Router);
  private  authService = inject(AuthService);
  private  userRoleService = inject(UserRoleService);
  private  destroyRef = inject(DestroyRef);

  activePage: string = '';
  currentUserRole: string = 'Member';
  private currentUser: any = null;

   navbarConfig = computed((): NavbarConfig => ({
    leftButtons: [],
    rightContent: 'custom-button',
    rightButtonConfig: {
      label: 'Speakers page',
      icon: 'arrow_forward',
      handler: this.goToSpeakersPage.bind(this),
      cssClass: 'flex items-center justify-between text-blue-600 text-sm py-0.5 px-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors'
    }
  }));

  constructor() {
    effect(() => {
      this.setupUserSubscription();
      this.setupRoleSubscription();

      const currentEventId = this.eventId();
      const currentUserRole = this.userRole();

      if (currentUserRole) {
        this.currentUserRole = currentUserRole;
      } else if (currentEventId && this.currentUser) {
        this.loadUserRole(this.currentUser.uid);
      }
    });
  }

  private setupUserSubscription(): void {
    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
        const currentEventId = this.eventId();

        if (user && currentEventId) {
          this.loadUserRole(user.uid);
        }
      });
  }

  private setupRoleSubscription(): void {
    this.userRoleService.getRole()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(role => {
        if (role) {
          this.currentUserRole = role;
        }
      });
  }

  private loadUserRole(userId: string): void {
    const currentEventId = this.eventId();
    if (!currentEventId) return;
  }

  private goToSpeakersPage(): void {
    const currentEventId = this.eventId();
    if (currentEventId) {
      this.router.navigate(['/event-speakers', currentEventId]);
    }
  }
}
