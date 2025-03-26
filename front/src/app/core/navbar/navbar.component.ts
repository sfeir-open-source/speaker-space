import { Component } from '@angular/core';
import { AuthService } from '../login/services/auth.service';
import { SidebarService } from '../sidebar/service/sidebar.service';
import { CommonModule } from '@angular/common';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import {filter, Subscription} from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isLogin: boolean = false;
  userName: string | null = null;
  userPhotoURL: string | null = null;
  userEmail: string | null = null;
  haveNotification: boolean = true;
  isHomePage: boolean = false;

  private routerSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit() {
    this.isHomePage = this.router.url === '/';

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isHomePage = event.url === '/';
        console.log('Current URL:', event.url, 'isHomePage:', this.isHomePage);
      });

    this.authService.user$.subscribe((user) => {
      this.isLogin = !!user;
      this.userName = user?.displayName || null;
      this.userPhotoURL = user?.photoURL || null;
      this.userEmail = user?.email || null;
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  get displayName(): string | null {
    return this.userName;
  }

  get isUserLoggedIn(): boolean {
    return this.isLogin;
  }

  handlePictureError(event: any) {
    event.target.src = 'img/profil-picture.svg';
  }

  openSidebar() {
    this.sidebarService.toggleSidebar(true, {
      displayName: this.userName,
      photoURL: this.userPhotoURL,
      email: this.userEmail
    });
  }
}
