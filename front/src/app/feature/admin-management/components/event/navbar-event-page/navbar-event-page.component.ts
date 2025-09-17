import { Component, OnDestroy, OnInit, input, signal, effect } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../../core/login/services/auth.service';
import { UserRoleService } from '../../../services/team/user-role.service';
import { EventService } from '../../../services/event/event.service';
import { NavbarAdminPageComponent } from '../../navbar-admin-page/navbar-admin-page.component';
import { NavbarConfig } from '../../../type/components/navbar-config';

@Component({
  selector: 'app-navbar-event-page',
  standalone: true,
  imports: [
    NavbarAdminPageComponent,
  ],
  templateUrl: './navbar-event-page.component.html',
  styleUrl: './navbar-event-page.component.scss'
})
export class NavbarEventPageComponent implements OnInit, OnDestroy {
  eventId = input<string>('');
  eventUrl = input<string>('');
  eventName = input<string>('');
  userRole = input<string>('');
  teamId = input<string>('');

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
    private eventService: EventService,
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
    this.setActivePage();

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setActivePage();
      }
    });

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
    const eventIdValue = this.eventId();

    const config: NavbarConfig = {
      leftButtons: [
        {
          id: 'session',
          label: 'Sessions',
          materialIcon: 'lists',
          route: `/event-sessions/${eventIdValue}`,
          handler: this.session.bind(this)
        },
        {
          id: 'speakers',
          label: 'Speakers',
          materialIcon: 'group',
          route: `/event-speakers/${eventIdValue}`,
          handler: this.speaker.bind(this)
        },
        {
          id: 'calendar',
          label: 'Schedule',
          materialIcon: 'calendar_today',
          handler: this.calendar.bind(this)
        },
        {
          id: 'settings',
          label: 'Settings',
          materialIcon: 'settings',
          handler: this.settings.bind(this)
        },
        {
          id: 'customize',
          label: 'Customize',
          materialIcon: 'brush',
          cssClass: 'lg:hidden',
          handler: this.customize.bind(this)
        }
      ],
      rightContent: 'custom-button',
      rightButtonConfig: {
        label: 'Event page',
        icon: 'arrow_forward',
        handler: this.goToEventPage.bind(this),
        cssClass: 'flex items-center justify-between text-blue-600 text-sm py-0.5 px-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors'
      }
    };

    this.navbarConfig.set(config);
  }

  private loadUserRole(userId: string): void {
    if (!this.eventId()) return;
    this.roleSubscription?.unsubscribe();
  }

  private setActivePage(): void {
    const currentRoute: string = this.router.url;
    const isMobile: boolean = window.innerWidth < 1024;

    let activePageValue = '';

    switch (true) {
      case currentRoute.includes('session'):
        activePageValue = 'session';
        break;
      case currentRoute.includes('speakers'):
        activePageValue = 'speakers';
        break;
      case currentRoute.includes('calendar'):
        activePageValue = 'calendar';
        break;
      case currentRoute.includes('event-detail'):
        activePageValue = 'settings';
        break;
      case currentRoute.includes('event-customize'):
        activePageValue = isMobile ? 'customize' : 'settings';
        break;
      default:
        activePageValue = '';
        break;
    }

    this.activePage.set(activePageValue);
  }

  private session(): void {
    const eventIdValue = this.eventId();
    if (!eventIdValue) return;
    this.router.navigate(['/event-sessions', eventIdValue]);
  }

  private speaker(): void {
    const eventIdValue = this.eventId();
    if (!eventIdValue) return;
    this.router.navigate(['/event-speakers', eventIdValue]);
  }

  private calendar(): void {
    const eventIdValue = this.eventId();
    if (!eventIdValue) return;
    this.router.navigate(['/event-calendar', eventIdValue]);
  }

  private settings(): void {
    const eventIdValue = this.eventId();
    if (!eventIdValue) return;
    this.router.navigate(['/event-detail', eventIdValue]);
  }

  private customize(): void {
    const eventIdValue = this.eventId();
    if (!eventIdValue) return;
    this.router.navigate(['/event-customize', eventIdValue]);
  }

  private goToEventPage(): void {
    const teamIdValue = this.teamId();
    const eventIdValue = this.eventId();

    if (teamIdValue) {
      this.router.navigate(['/team', teamIdValue]);
    } else if (eventIdValue) {
      this.eventService.getEventById(eventIdValue).subscribe({
        next: (event) => {
          if (!event) return;

          if (event.teamId && typeof event.teamId === 'string' && event.teamId.trim() !== '') {
            this.router.navigate(['/team', event.teamId]);
          }
        },
        error: (err) => {
          console.error('Error fetching event details for team navigation:', err);
        }
      });
    }
  }
}
