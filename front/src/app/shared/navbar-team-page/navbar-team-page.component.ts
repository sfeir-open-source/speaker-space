import { Component } from '@angular/core';
import {ButtonGreyComponent} from '../button-grey/button-grey.component';
import {SidebarNavItemComponent} from '../sidebar-nav-item/sidebar-nav-item.component';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';

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
    // Obtenir la route actuelle au moment du chargement du composant
    this.setActivePage();

    // Surveiller les changements de route pour définir l'état actif
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setActivePage();
      }
    });
  }

  // Cette fonction définit la page active en fonction de la route actuelle
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
