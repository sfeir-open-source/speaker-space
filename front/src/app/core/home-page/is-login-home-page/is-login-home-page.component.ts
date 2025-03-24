import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonGreyComponent} from '../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-is-login-home-page',
  standalone: true,
  imports: [CommonModule, ButtonGreyComponent],
  templateUrl: './is-login-home-page.component.html',
  styleUrl: './is-login-home-page.component.scss'
})
export class IsLoginHomePageComponent {
  activeTab: string = 'currents';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
