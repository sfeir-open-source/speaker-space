import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import { Router } from '@angular/router';
import {Subscription} from 'rxjs';
import {AuthService} from '../../../../../core/login/services/auth.service';
import {UserRoleService} from '../../../services/team/user-role.service';
import {NavbarAdminPageComponent} from '../../navbar-admin-page/navbar-admin-page.component';
import {NavbarConfig} from '../../../type/components/navbar-config';

@Component({
  selector: 'app-navbar-session-page',
  standalone: true,
  imports: [
    NavbarAdminPageComponent,
  ],
  templateUrl: './navbar-session-page.component.html',
  styleUrl: './navbar-session-page.component.scss'
})

export class NavbarSessionPageComponent implements OnInit, OnChanges, OnDestroy {
  @Input() eventId: string = '';
  @Input() eventUrl: string = '';
  @Input() eventName: string = '';
  @Input() userRole: string = '';
  @Input() sessionId: string = '';

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
      leftButtons: [],
      rightContent: 'custom-button',
      rightButtonConfig: {
        label: 'Sessions page',
        icon: 'arrow_forward',
        handler: this.goToSessionsPage.bind(this),
        cssClass: 'flex items-center justify-between text-blue-600 text-sm py-0.5 px-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors'
      }
    };
  }

  private loadUserRole(userId: string): void {
    if (!this.eventId) return;
    this.roleSubscription?.unsubscribe();
  }

  private goToSessionsPage(): void {
    if (this.eventId) {
      this.router.navigate(['/event-sessions', this.eventId]);
    }
  }
}
