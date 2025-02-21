import { Component } from '@angular/core';
import {SwitchDarkModeComponent} from '../switch-dark-mode/switch-dark-mode.component';

@Component({
  selector: 'app-navbar',
  imports: [
    SwitchDarkModeComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isLogin = true;

  haveNotification = false;

}
