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
  @Input() teamUrl: string = '';

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
    } else if (url.includes('/settings-customize')) {
      this.activeSection = 'settings-customize';
    } else if (url.includes('/support-speaker-space')) {
      this.activeSection = 'support-speaker-space';
    }
  }

  navigateTo(path: string) {
    if (!this.teamUrl) {
      return;
    }

    if (path === 'settings-general') {
      this.router.navigate(['/settings-general', this.teamUrl]);
    } else if (path === 'settings-customize') {
      this.router.navigate(['/settings-customize', this.teamUrl]);
    } else if (path === 'support-speaker-space') {
      this.router.navigate(['/support-speaker-space', this.teamUrl]);
    }
  }

  isActive(route: string): boolean {
    return this.activeSection === route;
  }
}
