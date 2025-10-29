import {Component, DestroyRef, inject, OnInit, signal, computed} from '@angular/core';
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
import {NavbarTeamPageComponent} from '../../../components/team/navbar-team-page/navbar-team-page.component';
import {ButtonComponent} from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-list-event-page',
  templateUrl: './list-event-page.component.html',
  imports: [
    EventTeamCardComponent,
    NavbarTeamPageComponent,
    ButtonComponent
  ],
  styleUrls: ['./list-event-page.component.css']
})
export class ListEventPageComponent implements OnInit {
  readonly activeTab = signal<'Active' | 'Archived'>('Active');
  readonly teamUrl = signal<string>('');
  readonly teamId = signal<string>('');
  readonly teamName = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly events = signal<Event[]>([]);

  readonly formFields = computed(() => {
    const filteredEvents = this.eventStatusService.filterEventsByStatus(
      this.events(),
      this.activeTab() === 'Archived'
    );
    return this.transformEventsToFields(filteredEvents);
  });

  private readonly _destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);
  private readonly eventService = inject(EventService);
  private readonly eventStatusService = inject(EventStatusService);

  ngOnInit(): void {
    this.loadTeamAndEvents();
  }

  private loadTeamAndEvents(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.teamId.set(params.get('teamId') || '');
        this.isLoading.set(true);
        this.error.set(null);
        return this.teamService.getTeamByUrl(this.teamId());
      }),
      switchMap(team => {
        this.teamName.set(team.name);
        this.teamId.set(team.id ?? '');
        return this.eventService.getEventsByTeam(this.teamId());
      }),
      takeUntilDestroyed(this._destroyRef),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (events: Event[]) => {
        this.events.set(events);
      },
      error: (err) => {
        console.error('Error loading team events:', err);
        this.error.set('Failed to load team details or events');
      }
    });
  }

  private transformEventsToFields(events: Event[]): EventTeamField[] {
    return events.map(event => {
      const status = this.eventStatusService.getEventStatus(event);

      return {
        idEvent: event.idEvent ?? '',
        title: event.eventName ?? 'Untitled Event',
        type: event.type ?? 'Unknown',
        img: event.logoBase64 || 'assets/img/logo-speaker-space.svg',
        link: event.webLinkUrl ?? '',
        statusText: status.statusText,
        statusClass: status.statusClass,
        publicUrl: event.url ?? '',
        logoBase64: event.logoBase64,
        daysRemaining: status.daysRemaining,
        finished: status.finished
      };
    });
  }

  setActiveTab(tab: 'Active' | 'Archived'): void {
    if (this.activeTab() !== tab) {
      this.activeTab.set(tab);
    }
  }

  addEvent(): void {
    if (this.teamId()) {
      this.router.navigate(['/create-event', this.teamId()]);
    }
  }
}
