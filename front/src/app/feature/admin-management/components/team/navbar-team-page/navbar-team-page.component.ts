import { Component, OnInit, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TeamMemberService } from '../../../services/team/team-member.service';
import { AuthService } from '../../../../../core/login/services/auth.service';
import { UserRoleService } from '../../../services/team/user-role.service';
import { NavbarAdminPageComponent } from '../../navbar-admin-page/navbar-admin-page.component';
import { NavbarConfig } from '../../../type/components/navbar-config';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-navbar-team-page',
  standalone: true,
  imports: [
    NavbarAdminPageComponent
  ],
  templateUrl: './navbar-team-page.component.html',
  styleUrl: './navbar-team-page.component.scss'
})
export class NavbarTeamPageComponent implements OnInit, OnDestroy {
  readonly teamUrl = input<string>('');
  readonly teamId = input<string>('');
  readonly teamName = input<string>('');
  readonly userRole = input<string>('');

  private readonly router = inject(Router);
  private readonly teamMemberService = inject(TeamMemberService);
  private readonly authService = inject(AuthService);
  private readonly userRoleService = inject(UserRoleService);

  private readonly _activePage = signal<string>('');
  private readonly _currentUserRole = signal<string>('Member');

  readonly activePage = this._activePage.asReadonly();
  readonly currentUserRole = this._currentUserRole.asReadonly();

  private readonly destroy$ = new Subject<void>();

  readonly user = toSignal(this.authService.user$, { initialValue: null });
  readonly globalRole = toSignal(
    this.userRoleService.getRole(),
    { initialValue: null }
  );

  readonly navbarConfig = computed<NavbarConfig>(() => {
    const teamId = this.teamId();

    return {
      leftButtons: [
        {
          id: 'team-page',
          label: 'Events',
          materialIcon: 'star',
          route: `/team/${teamId}`,
          handler: () => this.events()
        },
        {
          id: 'settings',
          label: 'Settings',
          materialIcon: 'settings',
          handler: () => this.settings()
        },
        {
          id: 'members',
          label: 'Members',
          materialIcon: 'groups',
          cssClass: 'lg:hidden',
          handler: () => this.members()
        }
      ],
      rightContent: 'role'
    };
  });

  private readonly isMobile = computed(() => {
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  });

  readonly currentUser = computed(() => {
    return this.user();
  });

  constructor() {
    effect(() => {
      const inputRole = this.userRole();
      if (inputRole) {
        this._currentUserRole.set(inputRole);
      }
    });

    effect(() => {
      const user = this.currentUser();
      const teamId = this.teamId();

      if (user?.uid && teamId) {
        this.loadUserRole(user.uid, teamId);
      }
    });

    effect(() => {
      const globalRole = this.globalRole();
      if (globalRole && !this.userRole()) {
        this._currentUserRole.set(globalRole);
      }
    });
  }

  ngOnInit(): void {
    this.setActivePage();

    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActivePage();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setActivePage(): void {
    const currentRoute = this.router.url;
    const isMobile = this.isMobile();

    switch (true) {
      case currentRoute.includes('/team/') && !currentRoute.includes('settings-'):
        this._activePage.set('team-page');
        break;
      case currentRoute.includes('settings-general'):
        this._activePage.set('settings');
        break;
      case currentRoute.includes('settings-members'):
        this._activePage.set(isMobile ? 'members' : 'settings');
        break;
      default:
        this._activePage.set('');
        break;
    }
  }

  private events(): void {
    const teamId = this.teamId();
    if (teamId) {
      this.router.navigate(['/team', teamId]);
    }
  }

  private settings(): void {
    const teamId = this.teamId();
    if (teamId) {
      this.router.navigate(['/settings-general', teamId]);
    }
  }

  private members(): void {
    const teamId = this.teamId();
    if (teamId) {
      this.router.navigate(['/settings-members', teamId]);
    }
  }

  private loadUserRole(userId: string, teamId: string): void {
    this.teamMemberService.getTeamMembers(teamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (members) => {
          const currentMember = members.find(m => m.userId === userId);
          if (currentMember) {
            this._currentUserRole.set(currentMember.role);
          }
        },
        error: (err) => {
          console.error('Error loading team members:', err);
        }
      });
  }
}
