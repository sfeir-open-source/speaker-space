import { Component } from '@angular/core';
import {NavbarTeamPageComponent} from '../components/navbar-team-page/navbar-team-page.component';
import {TeamSidebarComponent} from '../components/team-sidebar/team-sidebar.component';
import {FormsModule} from '@angular/forms';
import {InputComponent} from '../../../shared/input/input.component';
import {FormField} from '../../../shared/input/interface/form-field';
import {ButtonGreenActionsComponent} from '../../../shared/button-green-actions/button-green-actions.component';
import {Router} from '@angular/router';
import {MembersCardComponent} from '../components/members-card/members-card.component';
import {MemberTeamField} from '../components/members-card/interface/member-team-field';

@Component({
  selector: 'app-setting-team-members-page',
  imports: [
    NavbarTeamPageComponent,
    TeamSidebarComponent,
    FormsModule,
    InputComponent,
    ButtonGreenActionsComponent,
    MembersCardComponent
  ],
  templateUrl: './setting-team-members-page.component.html',
  styleUrl: './setting-team-members-page.component.scss'
})
export class SettingTeamMembersPageComponent {
  activeSection: string = 'setting-members';

  constructor(
    private router: Router,
  ) {}

  ngOnInit() {
    this.activeSection = 'setting-members';
  }

  field: FormField = {
    name: 'findmembers',
    placeholder:'Find member',
    icon: 'search',
    type: 'text',
  };

  membersFields: MemberTeamField[] = [
    {
      name: 'Topper Harley',
      role: 'Member',
      img: 'img/devfest.jpg',
    },
    {
      name: 'Fernand Naudin',
      role: 'Ower',
      img: 'img/profil-picture.svg',
    },
    {
      name: 'Andrew Steyn',
      role: 'Ower',
      img: 'img/devfest.jpg',
    },
    {
      name: 'Arthur Pendragon',
      role: 'Member',
      img: 'img/profil-picture.svg',
    }
  ];

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  onSubmit() {
  }
}
