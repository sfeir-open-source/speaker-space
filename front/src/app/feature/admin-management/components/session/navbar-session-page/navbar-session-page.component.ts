import { Component, OnDestroy, OnInit, input, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../../core/login/services/auth.service';
import { UserRoleService } from '../../../services/team/user-role.service';
import { NavbarAdminPageComponent } from '../../navbar-admin-page/navbar-admin-page.component';
import { NavbarConfig } from '../../../type/components/navbar-config';

@Component({
  selector: 'app-navbar-session-page',
  standalone: true,
  imports: [
    NavbarAdminPageComponent,
  ],
  templateUrl: './navbar-session-page.component.html',
  styleUrl: './navbar-session-page.component.scss'
})
export class NavbarSessionPageComponent implements OnInit, OnDestroy {
  eventId = input<string>('');
  eventUrl = input<string>('');
  eventName = input<string>('');
  userRole = input<string>('');
  sessionId = input<string>('');

  activePage = signal<string>('');
  currentUserRole = signal<string>('Member');
  navbarConfig = signal<NavbarConfig>({
    leftButtons: [],
    rightContent: undefined,
    rightButtonConfig: undefined
  });

  private currentUser = signal<any>(null);
  private userSubscription?: Subscription;
  private roleSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userRoleService: UserRoleService,
  ) {
    effect(() => {
      const userRoleValue = this.userRole();
      if (userRoleValue) {
        this.currentUserRole.set(userRoleValue);
      }
    });

    effect(() => {
      const eventIdValue = this.eventId();
      const currentUserValue = this.currentUser();

      if (eventIdValue && currentUserValue) {
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
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser.set(user);
      if (user && this.eventId()) {
        this.loadUserRole(user.uid);
      }
    });

    this.userRoleService.getRole().subscribe(role => {
      if (role) {
        this.currentUserRole.set(role);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.roleSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  private setupNavbarConfig(): void {
    const config: NavbarConfig = {
      leftButtons: [],
      rightContent: 'custom-button',
      rightButtonConfig: {
        label: 'Sessions page',
        icon: 'arrow_forward',
        handler: this.goToSessionsPage.bind(this),
        cssClass: 'flex items-center justify-between text-blue-600 text-sm py-0.5 px-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors'
      }
    };

    this.navbarConfig.set(config);
  }

  private loadUserRole(userId: string): void {
    const eventIdValue = this.eventId();
    if (!eventIdValue) return;

    this.roleSubscription?.unsubscribe();
  }

  private goToSessionsPage(): void {
    const eventIdValue = this.eventId();
    if (eventIdValue) {
      this.router.navigate(['/event-sessions', eventIdValue]);
    }
  }
}
