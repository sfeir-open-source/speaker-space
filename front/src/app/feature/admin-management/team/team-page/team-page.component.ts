import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavbarTeamPageComponent} from '../../components/navbar-team-page/navbar-team-page.component';
import {EventTeamCardComponent} from '../../../../shared/event-team-card/event-team-card.component';
import {EventTeamField} from '../../../../shared/event-team-card/interface/event-team-field';

@Component({
  selector: 'app-team-page',
  imports: [
    NavbarTeamPageComponent,
    CommonModule,
    EventTeamCardComponent,
  ],
  templateUrl: './team-page.component.html',
  styleUrl: './team-page.component.scss'
})
export class TeamPageComponent {
  activeTab: string = 'Active';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  formFields: EventTeamField[] = [
    {
      title: 'Devfest Nantes 2024',
      type: 'Conference',
      img: 'img/devfest.jpg',
      isOpen: true,
      link: '/',
      statusText:'Call for paper'
    },
    {
      title: 'Devfest Nantes 2025',
      type: 'Meetup',
      img: 'img/devfest.jpg',
      isOpen: false,
      link: '/',
      statusText:'Call for paper'
    },
    {
      title: 'Devfest Nantes 2024',
      type: 'Conference',
      img: 'img/devfest.jpg',
      isOpen: true,
      link: '/',
      statusText:'Call for paper'
    },
    {
      title: 'Devfest Nantes 2025',
      type: 'Meetup',
      img: 'img/devfest.jpg',
      isOpen: false,
      link: '/',
      statusText:'Call for paper'
    }
  ];

  constructor() {
    console.log('Form fields:', this.formFields);
  }
}
