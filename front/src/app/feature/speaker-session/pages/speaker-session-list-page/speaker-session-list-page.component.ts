import {Component, inject} from '@angular/core';
import {SessionImportData, Speaker} from '../../../admin-management/type/session/session';
import {BaseListComponent} from '../../../admin-management/components/class/base-list-component';
import {SpeakerSessionService} from '../../services/speaker-session.service';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../admin-management/services/event/event.service';
import {SpeakerService} from '../../../admin-management/services/speaker/speaker.service';
import {EventDataService} from '../../../admin-management/services/event/event-data.service';
import {finalize} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-speaker-session-list-page',
  imports: [
    FormsModule
  ],
  templateUrl: './speaker-session-list-page.component.html',
  styleUrl: './speaker-session-list-page.component.scss'
})
export class SpeakerSessionListPageComponent extends BaseListComponent<SessionImportData> {

  private speakerSessionService = inject(SpeakerSessionService);
  totalSessions: number | undefined;

  constructor(
    route: ActivatedRoute,
    router: Router,
    eventService: EventService,
    speakerService: SpeakerService,
    eventDataService: EventDataService
  ) {
    super(route, router, eventService, speakerService, eventDataService);
  }

  loadItems(): void {
    if (!this.eventId) return;

    this.isLoadingItems = true;

    this.speakerSessionService.getMySessions(this.eventId)
      .pipe(
        finalize(() => this.isLoadingItems = false),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        next: (sessions: SessionImportData[]) => {
          const sortedSessions: SessionImportData[] = sessions.sort((a, b) => {
            const titleA: string = a.title?.toLowerCase() || '';
            const titleB: string = b.title?.toLowerCase() || '';
            return titleA.localeCompare(titleB);
          });

          this.items = sortedSessions;
          this.filteredItems = [...sortedSessions];
          this.totalItems = sortedSessions.length;
          this.calculatePagination();
        },
        error: () => {
          this.error = 'Failed to load your sessions. Please try again.';
          this.items = [];
          this.filteredItems = [];
          this.totalItems = 0;
        }
      });
  }

  getItemId(session: SessionImportData): string {
    return session.id || '';
  }

  openItemDetail(sessionId: string): void {
    if (sessionId) {
      this.router.navigate(['/speaker/event', this.eventId, 'session', sessionId]);
    }
  }

  formatSpeakers(speakers: Speaker[] | undefined): string {
    if (!speakers || speakers.length === 0) return 'No speaker';
    return speakers.map(speaker => speaker.name).filter(name => name).join(', ');
  }

  filterItems(): void {
    let filtered: SessionImportData[] = [...this.items];

    if (this.searchTerm.trim()) {
      const searchLower: string = this.searchTerm.toLowerCase();
      filtered = filtered.filter(session =>
        session.title?.toLowerCase().includes(searchLower) ||
        session.abstractText?.toLowerCase().includes(searchLower)
      );
    }

    this.filteredItems = filtered;
    this.updateItemsAfterFilter();
  }
}
