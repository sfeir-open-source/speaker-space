import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { UserDataService } from '../services/user-services/user-data.service';
import { AuthService } from '../login/services/auth.service';
import { TeamService } from '../../feature/admin-management/services/team.service';
import { Team } from '../../feature/admin-management/type/team';
import {ButtonWithIconComponent} from '../../shared/button-with-icon/button-with-icon.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    ButtonWithIconComponent,
    CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentRoute = '';
  hasUnreadNotifications = true;
  notificationCount = 1;
  teams: Team[] = [];
  isLoadingTeams = false;

  private routerSubscription?: Subscription;
  private teamsSubscription?: Subscription;

  constructor(
    public userDataService: UserDataService,
    private authService: AuthService,
    private router: Router,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.subscribeToRouterEvents();
    this.loadTeams();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  private subscribeToRouterEvents(): void {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });

    this.currentRoute = this.router.url;
  }

  private loadTeams(): void {
    this.isLoadingTeams = true;
    this.teamsSubscription = this.teamService.teams$.subscribe({
      next: (teams) => {
        this.teams = teams;
        this.isLoadingTeams = false;
      },
      error: () => {
        this.isLoadingTeams = false;
      }
    });

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

  navigateToTeam(teamUrl: string | undefined): void {
    if (teamUrl) {
      this.router.navigate(['/team', teamUrl]);
      this.closeSidebar();
    }
  }

  createNewTeam(): void {
    this.navigateTo('/create-team');
  }

  private unsubscribeAll(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.teamsSubscription) {
      this.teamsSubscription.unsubscribe();
    }
  }
}
