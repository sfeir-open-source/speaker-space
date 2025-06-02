import {Component, Input} from '@angular/core';
import {SidebarAdminPageComponent} from '../../sidebar-admin-page/sidebar-admin-page.component';
import {SidebarConfig} from '../../../type/components/sidebar-config';

@Component({
  selector: 'app-sidebar-team',
  standalone: true,
  imports: [
    SidebarAdminPageComponent
  ],
  templateUrl: './sidebar-team.component.html',
  styleUrl: './sidebar-team.component.scss'
})
export class SidebarTeamComponent {
  @Input() teamId: string = '';

  readonly sidebarConfig: SidebarConfig = {
    buttons: [
      {
        id: 'settings-general',
        label: 'General',
        materialIcon: 'settings',
        route: 'settings-general'
      },
      {
        id: 'settings-members',
        label: 'Members',
        materialIcon: 'groups',
        route: 'settings-members'
      },
      {
        id: 'support-speaker-space',
        label: 'Support Speaker Space',
        materialIcon: 'favorite',
        route: 'support-speaker-space',
        isDisabled: true
      }
    ]
  };

}
