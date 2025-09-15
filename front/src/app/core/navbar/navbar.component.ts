import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import {filter, startWith} from 'rxjs';
import {AuthService} from '../login/services/auth.service';
import {UserDataService} from '../services/user-services/user-data.service';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';

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

  private userDataService = inject(UserDataService);
  isHomePage = toSignal(
    inject(Router).events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => event.url === '/'),
      startWith(inject(Router).url === '/')
    )
  );
  constructor() {
    inject(AuthService).user$.pipe(takeUntilDestroyed())
      .subscribe((user) => {
        this.isLogin = !!user;
        this.userName = user?.displayName || null;
        this.userPhotoURL = user?.photoURL || null;
        this.userEmail = user?.email || null;
      });
  }


  handlePictureError(event: any) {
    event.target.src = 'assets/img/profil-picture.svg';
  }

  openSidebar() {
    this.userDataService.toggleSidebar(true, {
      displayName: this.userName,
      photoURL: this.userPhotoURL,
      email: this.userEmail
    });
  }
}
