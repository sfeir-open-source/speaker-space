import {Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs';
import {ButtonWithIconComponent} from '../../../shared/button-with-icon/button-with-icon.component';
import {AuthService} from '../../services/auth.service';
import {UserDataService} from '../../services/user-data.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonWithIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  currentRoute: string = '';
  hasUnreadNotifications: boolean = true;
  notificationCount: number = 1;

  constructor(
    public sidebarService: UserDataService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });

    this.currentRoute = this.router.url;
  }


  closeSidebar() {
    this.sidebarService.toggleSidebar(false);
  }

  logout() {
    this.authService.logout();
    this.closeSidebar();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.closeSidebar();
  }

  createNewTeam() {
    console.log('Creating new team...');
    this.navigateTo('/create-team');
    this.closeSidebar();
  }
}
