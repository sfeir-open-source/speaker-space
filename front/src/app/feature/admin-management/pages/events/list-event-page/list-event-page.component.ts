import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import { switchMap } from 'rxjs/operators';
import {EventTeamCardComponent} from '../../../components/event/event-team-card/event-team-card.component';
import {NavbarTeamPageComponent} from '../../../components/team/navbar-team-page/navbar-team-page.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {EventTeamField} from '../../../components/event/event-team-card/interface/event-team-field';
import {TeamService} from '../../../services/team/team.service';
import {EventService} from '../../../services/event/event.service';
import {Event} from '../../../type/event/event';

@Component({
  selector: 'app-list-event-page',
  imports: [
    CommonModule,
    EventTeamCardComponent,
    NavbarTeamPageComponent,
    ButtonGreyComponent,
  ],
  templateUrl: './list-event-page.component.html',
  styleUrl: './list-event-page.component.scss'
})
export class ListEventPageComponent implements OnInit {
  activeTab: string = 'Active';
  teamUrl: string = '';
  teamId: string = '';
  teamName: string = '';
  formFields: EventTeamField[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  events: Event[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private teamService: TeamService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.teamUrl = params.get('teamUrl') || '';
        this.isLoading = true;
        return this.teamService.getTeamByUrl(this.teamUrl);
      }),
      switchMap(team => {
        this.teamName = team.name;
        this.teamId = team.id ?? '';
        return this.eventService.getEventsByTeam(this.teamId);
      })
    ).subscribe({
      next: (events: Event[]) => {
        this.events = events;
        this.formFields = this.transformEventsToFields(events);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load team details or events';
        this.isLoading = false;
      }
    });
  }

  transformEventsToFields(events: Event[]): EventTeamField[] {
    return events
      .filter(event => {
        const isFinished = event.isFinish || false;
        return this.activeTab === 'Achived' ? isFinished : !isFinished;
      })
      .map(event => ({
        idEvent: event.idEvent || '',
        title: event.eventName,
        type: 'event',
        img: '',
        link: event.webLinkUrl || '',
        statusText: event.isFinish ? 'Closed' : 'Open'
      }));
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    if (this.events.length > 0) {
      this.formFields = this.transformEventsToFields(this.events);
    }
  }

  addEvent() {
    if (this.teamId) {
      this.router.navigate(['/create-event', this.teamId]);
    }
  }
}
