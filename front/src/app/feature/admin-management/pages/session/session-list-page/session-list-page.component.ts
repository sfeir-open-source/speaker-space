import { Component, input, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SessionImportData } from '../../../type/session/session';
import { SessionFilterPopupComponent } from '../../../components/session/session-filter-popup/session-filter-popup.component';
import { BaseListService } from '../../../components/services/base-list.service';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import { ButtonComponent } from '../../../../../shared/button/button.component';
import { PaginationListComponent } from '../../../components/pagination-list/pagination-list.component';
import { SessionFilterService } from '../../../services/sessions/session-filter.service';
import { SessionFormatterService } from '../../../services/sessions/session-formatter.service';
import { SessionCreatePopupComponent } from '../../../components/session/session-create-popup/session-create-popup.component';
import { SessionService } from '../../../services/sessions/session.service';

@Component({
  selector: 'app-session-list-page',
  standalone: true,
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    SessionFilterPopupComponent,
    AsyncPipe,
    ButtonComponent,
    PaginationListComponent,
    SessionCreatePopupComponent
  ],
  providers: [BaseListService, SessionFilterService],
  templateUrl: './session-list-page.component.html',
  styleUrl: './session-list-page.component.scss'
})
export class SessionListPageComponent implements OnInit {
  readonly icon = input<string>('search');
  private readonly listService = inject(BaseListService<SessionImportData>);
  private readonly filterService = inject(SessionFilterService);
  private readonly formatterService = inject(SessionFormatterService);
  private readonly sessionService = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  readonly showFilterPopup = signal<boolean>(false);
  readonly showCreatePopup = signal<boolean>(false);
  readonly availableTracks = signal<string[]>([]);
  readonly eventStartDate = signal<Date | undefined>(undefined);
  readonly eventEndDate = signal<Date | undefined>(undefined);

  readonly state$ = this.listService.state$;
  readonly totalSessions = this.listService.paginationService.totalItemsSignal;
  readonly isLoadingSessions = computed(() => this.listService.getCurrentState().isLoadingItems);
  readonly paginatedSessions = this.listService.paginationService.paginatedItemsSignal;
  readonly totalPages = this.listService.paginationService.totalPagesSignal;
  readonly selectAll = computed(() => this.listService.getCurrentState().selectAll);
  readonly selectedItems = computed(() => this.listService.getCurrentState().selectedItems);
  readonly searchTerm = computed(() => this.listService.getCurrentState().searchTerm);
  readonly eventId = computed(() => this.listService.getCurrentState().eventId);

  readonly availableFormats = this.filterService.availableFormats;
  readonly availableCategories = this.filterService.availableCategories;
  readonly currentFilters = this.filterService.currentFilters;
  readonly hasActiveFilters = this.filterService.hasActiveFilters;
  readonly activeFiltersCount = this.filterService.activeFiltersCount;

  formatSpeakers = this.formatterService.formatSpeakers.bind(this.formatterService);

  readonly Math = Math;

  constructor(eventDataService: EventDataService) {
    (this.listService as any).eventService = this.eventService;
    (this.listService as any).eventDataService = eventDataService;
  }

  ngOnInit(): void {
    this.listService.initializeRouteSubscription(this.route, () => this.loadItems());
  }

  private async loadItems(): Promise<void> {
    const currentState = this.listService.getCurrentState();
    if (!currentState.eventId) return;

    this.listService.updateState({ isLoadingItems: true });

    return new Promise((resolve, reject) => {
      this.eventService.getSessionsByEventId(currentState.eventId)
        .pipe(
          finalize(() => this.listService.updateState({ isLoadingItems: false })),
          takeUntilDestroyed(this.listService['destroyRef'])
        )
        .subscribe({
          next: (sessions: SessionImportData[]) => {
            const sortedSessions = this.formatterService.sortByTitle(sessions);
            this.listService.updateItems(sortedSessions);
            this.filterService.extractFiltersFromSessions(sessions);
            resolve();
          },
          error: () => {
            this.listService.updateState({ error: 'Failed to load sessions. Please try again.' });
            this.listService.updateItems([]);
            reject();
          }
        });
    });
  }

  openFilterPopup(): void {
    this.showFilterPopup.set(true);
  }

  closeFilterPopup(): void {
    this.showFilterPopup.set(false);
  }

  onFiltersApplied(filters: any): void {
    this.filterService.updateFilters(filters);
    this.applyFilters();
    this.closeFilterPopup();
  }

  onFiltersReset(): void {
    this.filterService.resetFilters();
    this.applyFilters();
  }

  private applyFilters(): void {
    const items = this.listService.getCurrentItems();
    const searchTerm = this.listService.getCurrentState().searchTerm;
    const filtered = this.filterService.applyAllFilters(items, searchTerm);
    this.listService.updateFilteredItems(filtered);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.listService.onSearch(target.value);
    this.applyFilters();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
  }

  isSessionSelected(sessionId: string | undefined): boolean {
    if (!sessionId) return false;
    return this.selectedItems().includes(sessionId);
  }

  toggleSessionSelection(sessionId: string): void {
    this.listService.toggleItemSelection(sessionId);
  }

  toggleSelectAll(): void {
    this.listService.toggleSelectAll((session: SessionImportData) =>
      this.formatterService.getSessionId(session)
    );
  }

  openItemDetail(sessionId: string): void {
    const currentState = this.listService.getCurrentState();
    if (sessionId) {
      this.router.navigate(['/event', currentState.eventId, 'session', sessionId]);
    }
  }

  onRowClick(session: SessionImportData, event: Event): void {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const isCheckboxArea = target.closest('.checkbox-area');
    const sessionId = this.formatterService.getSessionId(session);

    if (!sessionId) return;

    if (isCheckboxArea) {
      this.toggleSessionSelection(sessionId);
    } else {
      this.openItemDetail(sessionId);
    }
  }

  onCreateSession(): void {
    this.showCreatePopup.set(true);
  }

  onCloseCreatePopup(): void {
    this.showCreatePopup.set(false);
  }

  onSessionCreated(): void {
    this.showCreatePopup.set(false);
    this.loadItems();
  }
}
