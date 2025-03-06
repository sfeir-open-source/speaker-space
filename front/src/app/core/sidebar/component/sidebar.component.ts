import { Component } from '@angular/core';
import { SidebarService } from '../service/sidebar.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../login/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  constructor(
    public sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router
  ) {}

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
}
