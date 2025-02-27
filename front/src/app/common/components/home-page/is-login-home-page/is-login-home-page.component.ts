import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-is-login-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './is-login-home-page.component.html',
  styleUrl: './is-login-home-page.component.scss'
})
export class IsLoginHomePageComponent {
  activeTab: string = 'currents';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
