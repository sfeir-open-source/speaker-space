import { Component } from '@angular/core';
import {ButtonWithIconComponent} from '../button-with-icon/button-with-icon.component';
import {ButtonGreenActionsComponent} from '../button-green-actions/button-green-actions.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-navbar-profile',
  imports: [
    ButtonWithIconComponent,
    ButtonGreenActionsComponent
  ],
  templateUrl: './navbar-profile.component.html',
  styleUrl: './navbar-profile.component.scss'
})
export class NavbarProfileComponent {
  userPhotoURL: string | null = null;

  constructor(
    private router: Router
  ) {}

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
