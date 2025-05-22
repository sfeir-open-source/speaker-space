import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {TeamMemberService} from '../../../services/team/team-member.service';
import {AuthService} from '../../../../../core/login/services/auth.service';
import {UserRoleService} from '../../../services/team/user-role.service';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-navbar-team-page',
  standalone: true,
  imports: [
    ButtonGreyComponent,
  ],
  templateUrl: './navbar-team-page.component.html',
  styleUrl: './navbar-team-page.component.scss'
})
export class NavbarTeamPageComponent implements OnInit, OnChanges, OnDestroy {
  @Input() teamUrl: string = '';
  @Input() teamId: string = '';
  @Input() teamName: string = '';
  @Input() userRole: string = '';

  activePage: string = '';
  currentUserRole: string = 'Member';
  private userSubscription?: Subscription;
  private roleSubscription?: Subscription;
  private currentUser: any = null;

  constructor(
    private router: Router,
    private teamMemberService: TeamMemberService,
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
      if (user && this.teamId) {
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
    } else if (changes['teamId'] && changes['teamId'].currentValue && this.currentUser) {
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
    if (!this.teamId) return;

    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }

    this.roleSubscription = this.teamMemberService.getTeamMembers(this.teamId)
      .subscribe({
        next: (members) => {
          const currentMember = members.find(m => m.userId === userId);
          if (currentMember) {
            this.currentUserRole = currentMember.role;
          }
        },
        error: (err) => {
          console.error('Error loading team members:', err);
        }
      });
  }

  setActivePage() {
    const currentRoute : string = this.router.url;
    const isMobile : boolean = window.innerWidth < 1024;

    switch (true) {
      case currentRoute.includes('/team/') && !currentRoute.includes('settings-'):
        this.activePage = 'team-page';
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
    if (this.teamUrl) {
      this.router.navigate(['/team', this.teamUrl]);
    } else if (this.teamId) {
      this.router.navigate(['/team', this.teamId]);
    }
  }

  settings() {
    if (this.teamUrl) {
      this.router.navigate(['/settings-general', this.teamUrl]);
    } else if (this.teamId) {
      this.router.navigate(['/settings-general', this.teamId]);
    }
  }

  members() {
    if (this.teamUrl) {
      this.router.navigate(['/settings-members', this.teamUrl]);
    } else if (this.teamId) {
      this.router.navigate(['/settings-members', this.teamId]);
    }
  }
}
