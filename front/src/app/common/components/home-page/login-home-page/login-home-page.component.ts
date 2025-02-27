import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-login-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-home-page.component.html',
  styleUrl: './login-home-page.component.scss'
})
export class LoginHomePageComponent {
  activeTab: string = 'currents';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
