import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {Subscription} from 'rxjs';
import {AuthService} from '../../../../../core/login/services/auth.service';
import {UserRoleService} from '../../../services/team/user-role.service';

@Component({
  selector: 'app-navbar-event-page',
  standalone: true,
  imports: [
    ButtonGreyComponent,
  ],
  templateUrl: './navbar-event-page.component.html',
  styleUrl: './navbar-event-page.component.scss'
})
export class NavbarEventPageComponent implements OnInit {
  @Input() eventUrl: string = '';
  @Input() eventId: string = '';
  @Input() eventName: string = '';
  @Input() userRole: string = '';

  activePage: string = '';
  currentUserRole: string = 'Member';
  private userSubscription?: Subscription;
  private roleSubscription?: Subscription;
  private currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userRoleService: UserRoleService
  ) {}

  ngOnInit(): void {
    this.setActivePage();
    this.router.events.subscribe(event => {
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
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }

  loadUserRole(userId: string): void {
    if (!this.eventId) return;

    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }

  setActivePage() {
    const currentRoute : string = this.router.url;
    const isMobile : boolean = window.innerWidth < 1024;

    switch (true) {
      case currentRoute.includes('/event/') && !currentRoute.includes('settings-'):
        this.activePage = 'event-page';
        break;

      case currentRoute.includes('settings-general'):
        this.activePage = 'settings';
        break;

      case currentRoute.includes('settings-members'):
        this.activePage = isMobile ? 'members' : 'settings';
        break;

      default:
        this.activePage = '';
        break;
    }
  }

  events() {
    if (this.eventUrl) {
      this.router.navigate(['/event', this.eventUrl]);
    } else if (this.eventId) {
      this.router.navigate(['/event', this.eventId]);
    }
  }

  settings() {
    if (this.eventUrl) {
      this.router.navigate(['/settings-general', this.eventUrl]);
    } else if (this.eventId) {
      this.router.navigate(['/settings-general', this.eventId]);
    }
  }

  members() {
    if (this.eventUrl) {
      this.router.navigate(['/settings-members', this.eventUrl]);
    } else if (this.eventId) {
      this.router.navigate(['/settings-members', this.eventId]);
    }
  }
}
