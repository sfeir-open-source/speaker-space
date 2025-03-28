import { Component } from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {ButtonGreyComponent} from '../../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-navbar-team-page',
  imports: [
    ButtonGreyComponent,
  ],
  templateUrl: './navbar-team-page.component.html',
  styleUrl: './navbar-team-page.component.scss'
})
export class NavbarTeamPageComponent {
  activePage: string = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
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
    if (currentRoute.includes('team-page')) {
      this.activePage = 'team-page';
    } else if (currentRoute.includes('settings')) {
      this.activePage = 'settings';
    }
  }

  events() {
    console.log('Navigating to team page...');
    this.router.navigate(['/team-page']);
  }

  settings() {
    console.log('Navigating to settings...');
    this.router.navigate(['/team-settings']);
  }
}
