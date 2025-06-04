import {Component, Input } from '@angular/core';
import {SidebarConfig} from '../../../type/components/sidebar-config';
import {SidebarAdminPageComponent} from '../../sidebar-admin-page/sidebar-admin-page.component';

@Component({
  selector: 'app-sidebar-event',
  standalone: true,
  imports: [
    SidebarAdminPageComponent
  ],
  templateUrl: './sidebar-event.component.html',
  styleUrl: './sidebar-event.component.scss'
})
export class SidebarEventComponent {
  @Input() eventId: string = '';

  readonly sidebarConfig: SidebarConfig = {
    buttons: [
      {
        id: 'event-detail',
        label: 'Setting',
        materialIcon: 'settings',
        route: 'event-detail'
      },
      {
        id: 'event-customize',
        label: 'Customize',
        materialIcon: 'brush',
        route: 'event-customize'
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
