import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavigationEnd, Router} from '@angular/router';
import {filter, take} from 'rxjs';
import {ButtonWithIconComponent} from '../../shared/button-with-icon/button-with-icon.component';
import {UserDataService} from '../services/user-services/user-data.service';
import {AuthService} from '../login/services/auth.service';
import {Team} from '../../feature/admin-management/create-team/type/team';
import {TeamService} from '../../feature/admin-management/create-team/service/team.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonWithIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  currentRoute: string = '';
  hasUnreadNotifications: boolean = true;
  notificationCount: number = 1;
  teams: Team[] = [];
  isLoadingTeams: boolean = false;

  constructor(
    public userDataService: UserDataService,
    private authService: AuthService,
    private router: Router,
    private teamService: TeamService
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
    this.currentRoute = this.router.url;
    this.loadUserTeams();
  }

  loadUserTeams() {
    this.isLoadingTeams = true;

    this.teamService.getUserTeams().pipe(
      take(1)
    ).subscribe({
      next: (teams) => {
        this.teams = teams;
        this.isLoadingTeams = false;
      },
      error: (error) => {
        this.isLoadingTeams = false;
      }
    });
  }

  closeSidebar() {
    this.userDataService.toggleSidebar(false);
  }

  logout() {
    this.authService.logout();
    this.closeSidebar();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.closeSidebar();
  }

  navigateToTeam(teamUrl: string | undefined) {
    this.router.navigate(['/team', teamUrl]);
    this.closeSidebar();
  }

  createNewTeam() {
    this.navigateTo('/create-team');
    this.closeSidebar();
  }
}
