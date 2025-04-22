import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ButtonGreyComponent } from '../../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-navbar-team-page',
  imports: [
    ButtonGreyComponent,
  ],
  templateUrl: './navbar-team-page.component.html',
  styleUrl: './navbar-team-page.component.scss'
})
export class NavbarTeamPageComponent implements OnInit {
  @Input() teamUrl: string = '';
  @Input() teamId: string = '';
  @Input() teamName: string = '';

  activePage: string = '';

  constructor(
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.setActivePage();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setActivePage();
      }
    });
  }

  setActivePage() {
    const currentRoute = this.router.url;
    if (currentRoute.includes('/team/') && !currentRoute.includes('settings-')) {
      this.activePage = 'team-page';
    } else if (currentRoute.includes('settings-')) {
      this.activePage = 'settings';
    }
  }

  events() {
    if (this.teamUrl) {
      this.router.navigate(['/team', this.teamUrl]);
    } else if (this.teamId) {
      this.router.navigate(['/team', this.teamId]);
    }
  }

  settings() {
    if (this.teamUrl) {
      this.router.navigate(['/settings-general', this.teamUrl]);
    } else if (this.teamId) {
      this.router.navigate(['/settings-general', this.teamId]);
    }
  }
}
