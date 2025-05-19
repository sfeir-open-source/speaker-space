import { Component } from '@angular/core';
import {NavbarTeamPageComponent} from "../../components/navbar-team-page/navbar-team-page.component";
import {NavbarEventPageComponent} from '../../components/navbar-event-page/navbar-event-page.component';

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [
    NavbarEventPageComponent
  ],
  templateUrl: './event-detail-page.component.html',
  styleUrl: './event-detail-page.component.scss'
})
export class EventDetailPageComponent {

}
