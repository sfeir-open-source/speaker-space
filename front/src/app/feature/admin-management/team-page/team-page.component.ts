import { Component } from '@angular/core';
import {NavbarTeamPageComponent} from '../../../shared/navbar-team-page/navbar-team-page.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-team-page',
  imports: [
    NavbarTeamPageComponent,
    CommonModule
  ],
  templateUrl: './team-page.component.html',
  styleUrl: './team-page.component.scss'
})
export class TeamPageComponent {
  activeTab: string = 'Active';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
