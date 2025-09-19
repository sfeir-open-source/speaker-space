import {Component, OnInit, input, signal, effect, inject, DestroyRef} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../core/login/services/auth.service';
import { UserRoleService } from '../../../services/team/user-role.service';
import { NavbarAdminPageComponent } from '../../navbar-admin-page/navbar-admin-page.component';
import { NavbarConfig } from '../../../type/components/navbar-config';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-navbar-session-page',
  standalone: true,
  imports: [
    NavbarAdminPageComponent,
  ],
  templateUrl: './navbar-session-page.component.html',
  styleUrl: './navbar-session-page.component.scss'
})
export class NavbarSessionPageComponent implements OnInit {
  readonly eventId = input<string>('');
  readonly eventUrl = input<string>('');
  readonly eventName = input<string>('');
  readonly userRole = input<string>('');
  readonly sessionId = input<string>('');

  readonly activePage = signal<string>('');
  readonly currentUserRole = signal<string>('Member');
  readonly navbarConfig = signal<NavbarConfig>({
    leftButtons: [],
    rightContent: undefined,
    rightButtonConfig: undefined
  });

  private currentUser = signal<any>(null);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const userRoleValue = this.userRole();
      if (userRoleValue) {
        this.currentUserRole.set(userRoleValue);
      }
    });

    effect(() => {
      const eventIdValue = this.eventId();
      const currentUserValue = this.currentUser();

      if (eventIdValue && currentUserValue?.uid) {
        this.loadUserRole(currentUserValue.uid);
      }
    });

    effect(() => {
      const eventIdValue = this.eventId();
      const eventUrlValue = this.eventUrl();

      if (eventIdValue || eventUrlValue) {
        this.setupNavbarConfig();
      }
    });
  }

  ngOnInit(): void {
    this.setupNavbarConfig();
    this.initializeSubscriptions();
  }

  private initializeSubscriptions(): void {
    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser.set(user);
        if (user?.uid && this.eventId()) {
          this.loadUserRole(user.uid);
        }
      });
    this.userRoleService.getRole()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(role => {
        if (role) {
          this.currentUserRole.set(role);
        }
      });
  }

  private setupNavbarConfig(): void {
    const config: NavbarConfig = {
      leftButtons: [],
      rightContent: 'custom-button',
      rightButtonConfig: {
        label: 'Sessions page',
        icon: 'arrow_forward',
        handler: () => this.goToSessionsPage(),
        cssClass: 'flex items-center justify-between text-blue-600 text-sm py-0.5 px-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors'
      }
    };

    this.navbarConfig.set(config);
  }

  private loadUserRole(userId: string): void {
    const eventIdValue = this.eventId();
    if (!eventIdValue) return;
  }

  private goToSessionsPage(): void {
    const eventIdValue = this.eventId();
    if (eventIdValue) {
      this.router.navigate(['/event-sessions', eventIdValue]);
    }
  }
}
