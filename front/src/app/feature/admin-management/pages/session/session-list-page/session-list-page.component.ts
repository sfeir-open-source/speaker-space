import {Component, Input} from '@angular/core';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {finalize, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {SessionImportData, Speaker} from '../../../type/session/session';
import {BaseListComponent} from '../../../components/class/base-list-component';

@Component({
  selector: 'app-session-list-page',
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    ButtonGreyComponent,
  ],
  templateUrl: './session-list-page.component.html',
  styleUrl: './session-list-page.component.scss'
})
export class SessionListPageComponent extends BaseListComponent<SessionImportData> {
  @Input() icon: string = 'search';

  get totalSessions(): number {
    return this.totalItems;
  }

  get isLoadingSessions(): boolean {
    return this.isLoadingItems;
  }

  get paginatedSessions(): SessionImportData[] {
    return this.paginatedItems;
  }

  Math = Math;

  constructor(
    route: ActivatedRoute,
    router: Router,
    eventService: EventService,
    eventDataService: EventDataService
  ) {
    super(route, router, eventService, eventDataService);
  }

  loadItems(): void {
    if (!this.eventId) return;

    this.isLoadingItems = true;

    this.eventService.getSessionsByEventId(this.eventId)
      .pipe(
        finalize(() => this.isLoadingItems = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (sessions: SessionImportData[]) => {
          const sortedSessions = sessions.sort((a, b) => {
            const titleA = a.title?.toLowerCase() || '';
            const titleB = b.title?.toLowerCase() || '';
            return titleA.localeCompare(titleB);
          });

          this.items = sortedSessions;
          this.filteredItems = [...sortedSessions];
          this.totalItems = sortedSessions.length;
          this.calculatePagination();
        },
        error: () => {
          this.error = 'Failed to load sessions. Please try again.';
          this.items = [];
          this.filteredItems = [];
          this.totalItems = 0;
        }
      });
  }

  getItemId(session: SessionImportData): string {
    return session.id || '';
  }

  filterItems(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(session =>
        session.title?.toLowerCase().includes(this.searchTerm) ||
        session.abstract?.toLowerCase().includes(this.searchTerm) ||
        session.speakers?.some(speaker =>
          speaker.name?.toLowerCase().includes(this.searchTerm)
        )
      );
    }

    this.updateItemsAfterFilter();
  }

  openItemDetail(sessionId: string): void {
    if (sessionId) {
      this.router.navigate(['/event', this.eventId, 'session', sessionId]);
    }
  }

  formatSpeakers(speakers: Speaker[] | undefined): string {
    if (!speakers || speakers.length === 0) return 'Aucun speaker';
    return speakers.map(speaker => speaker.name).filter(name => name).join(', ');
  }

  isSessionSelected(sessionId: string | undefined): boolean {
    if (!sessionId) return false;
    return this.selectedItems.includes(sessionId);
  }

  toggleSessionSelection(sessionId: string): void {
    this.toggleItemSelection(sessionId);
  }
}
