import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {Subscription} from 'rxjs';
import {
  NavbarAdminPageComponent
} from '../../../admin-management/components/navbar-admin-page/navbar-admin-page.component';
import {NavbarConfig} from '../../../admin-management/type/components/navbar-config';
import {AuthService} from '../../../../core/login/services/auth.service';
import {UserRoleService} from '../../../../core/services/user-services/user-role.service';

@Component({
  selector: 'app-navbar-speaker-section',
  standalone: true,
  imports: [
    NavbarAdminPageComponent,
  ],
  templateUrl: './navbar-speaker-section.component.html',
  styleUrl: './navbar-speaker-section.component.scss'
})

export class NavbarSpeakerSectionComponent implements OnInit, OnChanges, OnDestroy {
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
          route: `/speaker/event/${this.eventId}/sessions`,
          handler: this.session.bind(this)
        },
        {
          id: 'speaker',
          label: 'Your Profile',
          materialIcon: 'person',
          route: `/event/${this.eventId}/my-profile`,
          handler: this.speaker.bind(this)
        }
      ],
      rightContent: 'custom-button',
      rightButtonConfig: {
        label: 'Home page',
        icon: 'arrow_forward',
        handler: this.goToHomePage.bind(this),
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
      case currentRoute.includes('/my-profile'):
        this.activePage = 'speaker';
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

    this.router.navigate(['/speaker/event', this.eventId, 'sessions']);
  }

  private speaker(): void {
    if (!this.eventId) {
      return;
    }
    this.router.navigate(['/event', this.eventId , 'my-profile']);
  }

  private goToHomePage(): void {
    this.router.navigate(['/']);
  }
}
