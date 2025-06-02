import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { UserDataService } from '../services/user-services/user-data.service';
import { AuthService } from '../login/services/auth.service';
import {ButtonWithIconComponent} from '../../shared/button-with-icon/button-with-icon.component';
import {CommonModule} from '@angular/common';
import {TeamService} from '../../feature/admin-management/services/team/team.service';
import {Team} from '../../feature/admin-management/type/team/team';

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
  currentRoute : string = '';
  hasUnreadNotifications : boolean = true;
  notificationCount : number = 1;
  teams: Team[] = [];
  isLoadingTeams : boolean = true;

  private subscriptions: Subscription = new Subscription();
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

    const teamsSub = this.teamService.teams$.subscribe(teams => {
      this.teams = teams;
      this.isLoadingTeams = false;
    });

    this.teamService.loadUserTeams();

    this.subscriptions.add(teamsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private subscribeToRouterEvents(): void {
    const routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });

    this.currentRoute = this.router.url;
    this.subscriptions.add(routerSub);
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

  navigateToTeam(teamId: string | undefined): void {
    if (teamId) {
      this.router.navigate(['/team', teamId]);
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
