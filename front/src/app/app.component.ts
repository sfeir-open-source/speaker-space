import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {NavbarComponent} from './core/navbar/navbar.component';
import {FooterComponent} from './core/footer/footer.component';
import {SidebarComponent} from './core/sidebar/sidebar.component';
import {AuthService} from './core/login/services/auth.service';
import {filter, take} from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, SidebarComponent],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title:string = 'frontend';
  showNavbar: boolean = true;

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const hiddenRoutes: string[] = ['/not-found', '/login'];
        this.showNavbar = !hiddenRoutes.includes(this.router.url);
      }
    });
  }

  ngOnInit() {
    this.authService.user$.pipe(
      filter(user => !!user && !!user.email),
      take(1)
    ).subscribe(user => {
      if (user) {
        this.authService.processInvitations(user);
      }
    });
  }
}
