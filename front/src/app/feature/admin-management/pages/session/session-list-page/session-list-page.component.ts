import {Component, Input} from '@angular/core';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {finalize, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {Category, Format, SessionImportData, Speaker} from '../../../type/session/session';
import {BaseListComponent} from '../../../components/class/base-list-component';
import {SessionFilters} from '../../../type/session/session-filters';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {
  SessionUnifiedFilterPopupComponent
} from '../../../components/session/session-filter-popup/session-filter-popup.component';

@Component({
  selector: 'app-session-list-page',
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    ButtonGreyComponent,
    ButtonGreenActionsComponent,
    SessionUnifiedFilterPopupComponent,
  ],
  templateUrl: './session-list-page.component.html',
  styleUrl: './session-list-page.component.scss'
})
export class SessionListPageComponent extends BaseListComponent<SessionImportData> {
  @Input() icon: string = 'search';

  showFilterPopup : boolean = false;
  availableFormats: Format[] = [];
  availableCategories: Category[] = [];
  currentFilters: SessionFilters = {
    selectedFormats: [],
    selectedCategories: []
  };

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
    speakerService : SpeakerService,
    eventDataService: EventDataService
  ) {
    super(route, router, eventService, speakerService, eventDataService);
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
          const sortedSessions : SessionImportData[] = sessions.sort((a, b) => {
            const titleA : string = a.title?.toLowerCase() || '';
            const titleB : string = b.title?.toLowerCase() || '';
            return titleA.localeCompare(titleB);
          });

          this.items = sortedSessions;
          this.filteredItems = [...sortedSessions];
          this.totalItems = sortedSessions.length;

          this.extractAvailableFilters(sessions);

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


  private extractAvailableFilters(sessions: SessionImportData[]): void {
    const formatMap = new Map<string, Format>();
    sessions.forEach(session => {
      session.formats?.forEach(format => {
        if (format.id && !formatMap.has(format.id)) {
          formatMap.set(format.id, format);
        }
      });
    });
    this.availableFormats = Array.from(formatMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    const categoryMap = new Map<string, Category>();
    sessions.forEach(session => {
      session.categories?.forEach(category => {
        if (category.id && !categoryMap.has(category.id)) {
          categoryMap.set(category.id, category);
        }
      });
    });
    this.availableCategories = Array.from(categoryMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  openFilterPopup(): void {
    this.showFilterPopup = true;
  }

  closeFilterPopup(): void {
    this.showFilterPopup = false;
  }

  onFiltersApplied(filters: SessionFilters): void {
    this.currentFilters = filters;
    this.applyFilters();
    this.closeFilterPopup();
  }

  onFiltersReset(): void {
    this.currentFilters = {
      selectedFormats: [],
      selectedCategories: []
    };
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered : SessionImportData[] = [...this.items];

    if (this.currentFilters.selectedFormats.length > 0) {
      filtered = filtered.filter(session =>
        session.formats?.some(format =>
          this.currentFilters.selectedFormats.includes(format.id)
        )
      );
    }

    if (this.currentFilters.selectedCategories.length > 0) {
      filtered = filtered.filter(session =>
        session.categories?.some(category =>
          this.currentFilters.selectedCategories.includes(category.id)
        )
      );
    }

    if (this.searchTerm.trim()) {
      const searchLower : string = this.searchTerm.toLowerCase();
      filtered = filtered.filter(session =>
        session.title?.toLowerCase().includes(searchLower) ||
        session.abstractText?.toLowerCase().includes(searchLower) ||
        session.speakers?.some(speaker =>
          speaker.name?.toLowerCase().includes(searchLower)
        )
      );
    }

    this.filteredItems = filtered;
    this.updateItemsAfterFilter();
  }

  filterItems(): void {
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return this.currentFilters.selectedFormats.length > 0 ||
      this.currentFilters.selectedCategories.length > 0;
  }

  get activeFiltersCount(): number {
    return this.currentFilters.selectedFormats.length +
      this.currentFilters.selectedCategories.length;
  }
}
