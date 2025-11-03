import {Component, OnInit, inject, signal, computed, effect, DestroyRef} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {filter, map, switchMap, take} from 'rxjs';
import { UserDataService } from '../services/user-services/user-data.service';
import { AuthService } from '../login/services/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { CommonModule } from '@angular/common';
import { TeamService } from '../../feature/admin-management/services/team/team.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {Team} from '../../feature/admin-management/type/team/team';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ButtonComponent, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly teamService = inject(TeamService);
  private readonly destroyRef = inject(DestroyRef);
  readonly userDataService = inject(UserDataService);

  private readonly _hasUnreadNotifications = signal<boolean>(true);
  private readonly _notificationCount = signal<number>(1);

  readonly hasUnreadNotifications = this._hasUnreadNotifications.asReadonly();
  readonly notificationCount = this._notificationCount.asReadonly();

  readonly currentRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.url),
      takeUntilDestroyed()
    ),
    { initialValue: this.router.url }
  );

  readonly teams = toSignal(
    this.teamService.teams$,
    { initialValue: [] as Team[] }
  );

  readonly isLoadingTeams = signal<boolean>(false);

  readonly hasTeams = computed(() => {
    const teamsData = this.teams();
    return teamsData.length > 0;
  });

  ngOnInit(): void {
    this.authService.user$
      .pipe(
        filter(user => user !== null),
        take(1),
        switchMap(() => {
          this.isLoadingTeams.set(true);
          return this.teamService.loadUserTeams();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (teams) => {
          console.log('Teams loaded successfully:', teams.length);
          this.isLoadingTeams.set(false);
        },
        error: (error) => {
          console.error('Failed to load teams:', error);
          this.isLoadingTeams.set(false);
        }
      });
  }

  getSidebarButtonClasses(additionalClasses: string = ''): string {
    const baseClasses = 'group flex items-center gap-x-3 w-full text-left p-2 leading-6 transition-colors hover:bg-gray-100 rounded-md hover:text-gray-900';
    return additionalClasses ? `${baseClasses} ${additionalClasses}`.trim() : baseClasses;
  }

  getCloseSidebarHandler(): () => void {
    return () => this.closeSidebar();
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
