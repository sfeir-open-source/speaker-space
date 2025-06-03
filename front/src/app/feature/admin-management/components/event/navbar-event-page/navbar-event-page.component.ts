import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {Subscription} from 'rxjs';
import {AuthService} from '../../../../../core/login/services/auth.service';
import {UserRoleService} from '../../../services/team/user-role.service';
import {EventService} from '../../../services/event/event.service';
import {TeamService} from '../../../services/team/team.service';
import {NavbarAdminPageComponent} from '../../navbar-admin-page/navbar-admin-page.component';
import {NavbarConfig} from '../../../type/components/navbar-config';

@Component({
  selector: 'app-navbar-event-page',
  standalone: true,
  imports: [
    NavbarAdminPageComponent,
  ],
  templateUrl: './navbar-event-page.component.html',
  styleUrl: './navbar-event-page.component.scss'
})

export class NavbarEventPageComponent implements OnInit, OnChanges, OnDestroy {
  @Input() eventId: string = '';
  @Input() eventUrl: string = '';
  @Input() eventName: string = '';
  @Input() userRole: string = '';
  @Input() teamId: string = '';

  activePage: string = '';
  currentUserRole: string = 'Member';
  navbarConfig: NavbarConfig = { leftButtons: [] };

  private userSubscription?: Subscription;
  private roleSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userRoleService: UserRoleService,
    private eventService: EventService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.setupNavbarConfig();
    this.setActivePage();

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setActivePage();
      }
    });
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user && this.eventId) {
        this.loadUserRole(user.uid);
      }
    });

    this.userRoleService.getRole().subscribe(role => {
      if (role) {
        this.currentUserRole = role;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userRole'] && changes['userRole'].currentValue) {
      this.currentUserRole = changes['userRole'].currentValue;
    } else if (changes['eventId'] && changes['eventId'].currentValue && this.currentUser) {
      this.loadUserRole(this.currentUser.uid);
    }

    if (changes['eventId'] || changes['eventUrl']) {
      this.setupNavbarConfig();
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.roleSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  private setupNavbarConfig(): void {
    this.navbarConfig = {
      leftButtons: [
        {
          id: 'session',
          label: 'Sessions',
          materialIcon: 'lists',
          route: `/session/${this.eventId}`,
          handler: this.session.bind(this)
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
  }

  private loadUserRole(userId: string): void {
    if (!this.eventId) return;

    this.roleSubscription?.unsubscribe();
  }

  private setActivePage(): void {
    const currentRoute: string = this.router.url;
    const isMobile: boolean = window.innerWidth < 1024;

    switch (true) {
      case currentRoute.includes('session'):
        this.activePage = 'session';
        break;
      case currentRoute.includes('event-detail'):
        this.activePage = 'settings';
        break;
      case currentRoute.includes('event-customize'):
        this.activePage = isMobile ? 'customize' : 'settings';
        break;
      default:
        this.activePage = '';
        break;
    }
  }

  private session(): void {
    if (!this.eventId) {
      return;
    }

    this.router.navigate(['/session', this.eventId]);
  }

  private settings(): void {
    if (!this.eventId) {
      return;
    }

    this.router.navigate(['/event-detail', this.eventId]);
  }

  private customize(): void {
    if (!this.eventId) {
      return;
    }

    this.router.navigate(['/event-customize', this.eventId]);
  }

  private goToEventPage(): void {
    if (this.teamId) {
      this.router.navigate(['/team', this.teamId]);
    } else if (this.eventId) {
      this.eventService.getEventById(this.eventId).subscribe({
        next: (event) => {
          if (!event) {
            return;
          }

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

  private navigateToTeamById(teamId: string): void {
    if (!teamId || typeof teamId !== 'string' || teamId.trim() === '') {
      return;
    }

    this.teamService.getTeamById(teamId).subscribe({
      next: (team) => {
        if (!team) {
          console.error('Team data is null or undefined for teamId:', teamId);
          return;
        }

        if (team.id && typeof team.id === 'string' && team.id.trim() !== '') {
          this.router.navigate(['/team', team.id]);
        } else {
          console.warn('Team URL not found in team data for teamId:', teamId);
        }
      },
      error: (err) => {
        console.error('Error fetching team details for teamId:', teamId, err);
      }
    });
  }
}
