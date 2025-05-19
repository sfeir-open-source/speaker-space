import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ButtonGreyComponent } from '../../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-navbar-event-page',
  standalone: true,
  imports: [
    ButtonGreyComponent,
  ],
  templateUrl: './navbar-event-page.component.html',
  styleUrl: './navbar-event-page.component.scss'
})
export class NavbarEventPageComponent implements OnInit {
  @Input() eventUrl: string = '';
  @Input() eventId: string = '';
  @Input() eventName: string = '';

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
    this.activePage = 'settings';
  }


  settings() {
    if (this.eventUrl) {
      this.router.navigate(['/settings-general', this.eventUrl]);
    } else if (this.eventId) {
      this.router.navigate(['/settings-general', this.eventId]);
    }
  }
}
