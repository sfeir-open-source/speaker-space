import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { UserDataService } from '../services/user-services/user-data.service';
import { AuthService } from '../login/services/auth.service';
import {ButtonWithIconComponent} from '../../shared/button-with-icon/button-with-icon.component';
import {CommonModule} from '@angular/common';
import {TeamService} from '../../feature/admin-management/services/team/team.service';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ButtonWithIconComponent, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly teamService = inject(TeamService);
  readonly userDataService = inject(UserDataService);

  private readonly _hasUnreadNotifications = signal<boolean>(true);
  private readonly _notificationCount = signal<number>(1);

  readonly hasUnreadNotifications = this._hasUnreadNotifications.asReadonly();
  readonly notificationCount = this._notificationCount.asReadonly();

  readonly currentRoute = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).url),
      takeUntilDestroyed()
    ),
    { initialValue: this.router.url }
  );

  readonly teams = toSignal(
    this.teamService.teams$,
    { initialValue: null }
  );

  readonly isLoadingTeams = computed(() => {
    const teamsData = this.teams();
    return teamsData === null;
  });

  readonly hasTeams = computed(() => {
    const teamsData = this.teams();
    return teamsData !== null && teamsData.length > 0;
  });

  constructor() {
    effect(() => {
      console.log('Teams state:', {
        teams: this.teams(),
        isLoading: this.isLoadingTeams(),
        hasTeams: this.hasTeams()
      });
    });
  }

  ngOnInit(): void {
    this.teamService.loadUserTeams();
  }

  closeSidebar(): void {
    this.userDataService.toggleSidebar(false);
  }

  logout(): void {
    this.authService.logout();
    this.closeSidebar();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.closeSidebar();
  }

  navigateToTeam(teamId: string | undefined): void {
    if (teamId) {
      this.router.navigate(['/team', teamId]);
      this.closeSidebar();
    }
  }

  createNewTeam(): void {
    this.navigateTo('/create-team');
  }
}
