import {Component, Input, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs';
import {ButtonWithIconComponent} from '../../../../shared/button-with-icon/button-with-icon.component';

@Component({
  selector: 'app-team-sidebar',
  standalone: true,
  imports: [
    ButtonWithIconComponent
  ],
  templateUrl: './team-sidebar.component.html',
  styleUrl: './team-sidebar.component.scss'
})
export class TeamSidebarComponent implements OnInit {
  @Input() activeSection: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateActiveSection();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveSection();
    });
  }

  updateActiveSection() {
    const url = this.router.url;

    if (url.includes('/settings-general')) {
      this.activeSection = 'settings-general';
    } else if (url.includes('/settings-members')) {
      this.activeSection = 'settings-members';
    } else if (url.includes('/settings-support-speaker-space')) {
      this.activeSection = 'support-speaker-space';
    }
  }

  navigateTo(path: string) {
    if (path === 'settings-general') {
      this.router.navigate(['/settings-general']);
    } else if (path === 'settings-members') {
      this.router.navigate(['/settings-members']);
    } else if (path === 'support-speaker-space') {
      this.router.navigate(['/settings-support-speaker-space']);
    }
  }

  isActive(route: string): boolean {
    return this.activeSection === route;
  }
}
