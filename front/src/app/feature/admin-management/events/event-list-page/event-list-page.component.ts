import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import { NavbarTeamPageComponent } from '../../components/navbar-team-page/navbar-team-page.component';
import { EventTeamCardComponent } from '../../../../shared/event-team-card/event-team-card.component';
import { EventTeamField } from '../../../../shared/event-team-card/interface/event-team-field';
import { switchMap } from 'rxjs/operators';
import {ButtonGreyComponent} from '../../../../shared/button-grey/button-grey.component';
import {TeamService} from '../../services/team/team.service';
import {EventService} from '../../services/event/event.service';
import {Event} from '../../type/event/event';

@Component({
  selector: 'app-event-list-page',
  imports: [
    CommonModule,
    EventTeamCardComponent,
    NavbarTeamPageComponent,
    ButtonGreyComponent,
  ],
  templateUrl: './event-list-page.component.html',
  styleUrl: './event-list-page.component.scss'
})
export class EventListPageComponent implements OnInit {
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
        title: event.eventName,
        description: event.description || '',
        date: event.startDate || '',
        url: event.url || '',
        id: event.idEvent || '',
        type: 'event',
        isOpen: !event.isFinish,
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
