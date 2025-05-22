import {Component, Input, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs';
import {ButtonWithIconComponent} from '../../../../../shared/button-with-icon/button-with-icon.component';

@Component({
  selector: 'app-sidebar-event',
  standalone: true,
  imports: [
    ButtonWithIconComponent
  ],
  templateUrl: './sidebar-event.component.html',
  styleUrl: './sidebar-event.component.scss'
})
export class SidebarEventComponent implements OnInit {
  @Input() activeSection: string = '';
  @Input() eventUrl: string = '';

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
    const url: string = this.router.url;

    if (url.includes('/settings-general')) {
      this.activeSection = 'settings-general';
    } else if (url.includes('/settings-members')) {
      this.activeSection = 'settings-members';
    } else if (url.includes('/support-speaker-space')) {
      this.activeSection = 'support-speaker-space';
    }
  }

  navigateTo(path: string) {
    if (!this.eventUrl) {
      return;
    }

    if (path === 'settings-general') {
      this.router.navigate(['/settings-general', this.eventUrl]);
    } else if (path === 'settings-members') {
      this.router.navigate(['/settings-members', this.eventUrl]);
    } else if (path === 'support-speaker-space') {
      this.router.navigate(['/support-speaker-space', this.eventUrl]);
    }
  }

  isActive(route: string): boolean {
    return this.activeSection === route;
  }
}
