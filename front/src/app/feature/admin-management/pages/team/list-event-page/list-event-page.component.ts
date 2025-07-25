import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { switchMap } from 'rxjs/operators';
import {EventTeamField} from '../../../components/event/event-team-card/interface/event-team-field';
import {TeamService} from '../../../services/team/team.service';
import {EventService} from '../../../services/event/event.service';
import {Event} from '../../../type/event/event';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {finalize} from 'rxjs';
import {EventStatusService} from '../../../services/event/event-status.service';
import {EventTeamCardComponent} from '../../../components/event/event-team-card/event-team-card.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {NgClass} from '@angular/common';
import {NavbarTeamPageComponent} from '../../../components/team/navbar-team-page/navbar-team-page.component';

@Component({
  selector: 'app-list-event-page',
  templateUrl: './list-event-page.component.html',
  imports: [
    EventTeamCardComponent,
    ButtonGreyComponent,
    NgClass,
    NavbarTeamPageComponent
  ],
  styleUrls: ['./list-event-page.component.css']
})
export class ListEventPageComponent implements OnInit {
  activeTab: 'Active' | 'Archived' = 'Active';
  teamUrl: string = '';
  teamId: string = '';
  teamName: string = '';
  formFields: EventTeamField[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  events: Event[] = [];
  eventCounts = { active: 0, archived: 0 };

  protected readonly _destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private teamService: TeamService,
    private eventService: EventService,
    private eventStatusService: EventStatusService
  ) {}

  ngOnInit(): void {
    this.loadTeamAndEvents();
  }

  private loadTeamAndEvents(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.teamId = params.get('teamId') || '';
        this.isLoading = true;
        this.error = null;
        return this.teamService.getTeamByUrl(this.teamId);
      }),
      switchMap(team => {
        this.teamName = team.name;
        this.teamId = team.id ?? '';
        return this.eventService.getEventsByTeam(this.teamId);
      }),
      takeUntilDestroyed(this._destroyRef),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (events: Event[]) => {
        this.events = events;
        this.updateEventCounts();
        this.updateFormFields();
      },
      error: (err) => {
        console.error('Error loading team events:', err);
        this.error = 'Failed to load team details or events';
      }
    });
  }

  private updateEventCounts(): void {
    this.eventCounts = this.eventStatusService.getEventCounts(this.events);
  }

  private transformEventsToFields(events: Event[]): EventTeamField[] {
    return events.map(event => {
      const status = this.eventStatusService.getEventStatus(event);

      return {
        idEvent: event.idEvent ?? '',
        title: event.eventName ?? 'Untitled Event',
        type: event.type ?? 'Unknown',
        img: event.logoBase64 || 'img/logo-speaker-space.svg',
        link: event.webLinkUrl ?? '',
        statusText: status.statusText,
        statusClass: status.statusClass,
        publicUrl: event.url ?? '',
        logoBase64: event.logoBase64,
        daysRemaining: status.daysRemaining,
        isFinished: status.isFinished
      };
    });
  }

  private updateFormFields(): void {
    const filteredEvents = this.eventStatusService.filterEventsByStatus(
      this.events,
      this.activeTab === 'Archived'
    );
    this.formFields = this.transformEventsToFields(filteredEvents);
  }

  setActiveTab(tab: 'Active' | 'Archived'): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      this.updateFormFields();
    }
  }

  addEvent(): void {
    if (this.teamId) {
      this.router.navigate(['/create-event', this.teamId]);
    }
  }
}
