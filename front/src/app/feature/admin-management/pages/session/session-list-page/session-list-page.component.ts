import { Component, input, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';

import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Category, Format, SessionImportData, Speaker } from '../../../type/session/session';
import { SessionFilters } from '../../../type/session/session-filters';
import { SessionFilterPopupComponent } from '../../../components/session/session-filter-popup/session-filter-popup.component';
import { BaseListService, ListState } from '../../../components/services/base-list.service';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import {ButtonComponent} from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-session-list-page',
  standalone: true,
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    SessionFilterPopupComponent,
    AsyncPipe,
    ButtonComponent
  ],
  providers: [BaseListService],
  templateUrl: './session-list-page.component.html',
  styleUrl: './session-list-page.component.scss'
})
export class SessionListPageComponent implements OnInit {
  readonly icon = input<string>('search');

  readonly showFilterPopup = signal<boolean>(false);
  readonly availableFormats = signal<Format[]>([]);
  readonly availableCategories = signal<Category[]>([]);
  readonly currentFilters = signal<SessionFilters>({
    selectedFormats: [],
    selectedCategories: []
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return filters.selectedFormats.length > 0 || filters.selectedCategories.length > 0;
  });

  readonly activeFiltersCount = computed(() => {
    const filters = this.currentFilters();
    return filters.selectedFormats.length + filters.selectedCategories.length;
  });

  readonly totalSessions = computed(() => this.listService.getCurrentState().totalItems);
  readonly isLoadingSessions = computed(() => this.listService.getCurrentState().isLoadingItems);
  readonly paginatedSessions = computed(() => this.listService.getPaginatedItems());
  readonly currentPage = computed(() => this.listService.getCurrentState().currentPage);
  readonly totalPages = computed(() => this.listService.getCurrentState().totalPages);
  readonly itemsPerPage = computed(() => this.listService.getCurrentState().itemsPerPage);
  readonly pageNumbers = computed(() => this.listService.getPageNumbers());
  readonly selectAll = computed(() => this.listService.getCurrentState().selectAll);
  readonly selectedItems = computed(() => this.listService.getCurrentState().selectedItems);
  readonly searchTerm = computed(() => this.listService.getCurrentState().searchTerm);

  readonly paginationInfo = computed(() => {
    const current = this.currentPage();
    const itemsPerPageValue = this.itemsPerPage();
    const total = this.totalSessions();

    return {
      start: (current - 1) * itemsPerPageValue + 1,
      end: Math.min(current * itemsPerPageValue, total),
      total
    };
  });

  readonly canGoToPreviousPage = computed(() => this.currentPage() > 1);
  readonly canGoToNextPage = computed(() => this.currentPage() < this.totalPages());

  readonly Math = Math;
  readonly listService = inject(BaseListService<SessionImportData>);
  readonly state$: Observable<ListState> = this.listService.state$;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService,
    eventDataService: EventDataService
  ) {
    (this.listService as any).eventService = eventService;
    (this.listService as any).eventDataService = eventDataService;
  }

  ngOnInit(): void {
    this.initializeRouteSubscription();
  }

  private initializeRouteSubscription(): void {
    this.listService.initializeRouteSubscription(
      this.route,
      () => this.loadItems()
    );
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
            const sortedSessions = this.sortSessionsByTitle(sessions);
            this.listService.updateItems(sortedSessions);
            this.extractAvailableFilters(sessions);
            resolve();
          },
          error: () => {
            this.listService.updateState({
              error: 'Failed to load sessions. Please try again.'
            });
            this.listService.updateItems([]);
            reject();
          }
        });
    });
  }

  private sortSessionsByTitle(sessions: SessionImportData[]): SessionImportData[] {
    return sessions.sort((a, b) => {
      const titleA = a.title?.toLowerCase() || '';
      const titleB = b.title?.toLowerCase() || '';
      return titleA.localeCompare(titleB);
    });
  }

  getItemId(session: SessionImportData): string {
    return session.id || '';
  }

  openItemDetail(sessionId: string): void {
    const currentState = this.listService.getCurrentState();
    if (sessionId) {
      this.router.navigate(['/event', currentState.eventId, 'session', sessionId]);
    }
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.listService.onSearch(target.value);
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.listService.goToPage(page);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
  }

  formatSpeakers(speakers: Speaker[] | undefined): string {
    if (!speakers || speakers.length === 0) return 'Aucun speaker';
    return speakers
      .map(speaker => speaker.name)
      .filter(name => name)
      .join(', ');
  }

  isSessionSelected(sessionId: string | undefined): boolean {
    if (!sessionId) return false;
    return this.selectedItems().includes(sessionId);
  }

  toggleSessionSelection(sessionId: string): void {
    this.listService.toggleItemSelection(sessionId);
  }

  toggleSelectAll(): void {
    this.listService.toggleSelectAll((session: SessionImportData) => this.getItemId(session));
  }

  onRowClick(session: SessionImportData, event: Event): void {
    event.preventDefault();

    const target = event.target as HTMLElement;
    const isCheckboxArea = target.closest('.checkbox-area');

    const sessionId = this.getItemId(session);
    if (!sessionId) return;

    if (isCheckboxArea) {
      this.toggleSessionSelection(sessionId);
    } else {
      this.openItemDetail(sessionId);
    }
  }

  private extractAvailableFilters(sessions: SessionImportData[]): void {
    const formats = this.extractUniqueFormats(sessions);
    const categories = this.extractUniqueCategories(sessions);

    this.availableFormats.set(formats);
    this.availableCategories.set(categories);
  }

  private extractUniqueFormats(sessions: SessionImportData[]): Format[] {
    const formatMap = new Map<string, Format>();

    sessions.forEach(session => {
      session.formats?.forEach(format => {
        if (format.id && !formatMap.has(format.id)) {
          formatMap.set(format.id, format);
        }
      });
    });

    return Array.from(formatMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private extractUniqueCategories(sessions: SessionImportData[]): Category[] {
    const categoryMap = new Map<string, Category>();

    sessions.forEach(session => {
      session.categories?.forEach(category => {
        if (category.id && !categoryMap.has(category.id)) {
          categoryMap.set(category.id, category);
        }
      });
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  openFilterPopup(): void {
    this.showFilterPopup.set(true);
  }

  closeFilterPopup(): void {
    this.showFilterPopup.set(false);
  }

  onFiltersApplied(filters: SessionFilters): void {
    this.currentFilters.set(filters);
    this.applyFilters();
    this.closeFilterPopup();
  }

  onFiltersReset(): void {
    this.currentFilters.set({
      selectedFormats: [],
      selectedCategories: []
    });
    this.applyFilters();
  }

  private applyFilters(): void {
    const items = this.listService.getCurrentItems();
    let filtered = [...items];

    const filters = this.currentFilters();

    if (filters.selectedFormats.length > 0) {
      filtered = this.filterByFormats(filtered, filters.selectedFormats);
    }

    if (filters.selectedCategories.length > 0) {
      filtered = this.filterByCategories(filtered, filters.selectedCategories);
    }

    const searchTerm = this.listService.getCurrentState().searchTerm;
    if (searchTerm.trim()) {
      filtered = this.filterBySearchTerm(filtered, searchTerm);
    }

    this.listService.updateFilteredItems(filtered);
  }

  private filterByFormats(sessions: SessionImportData[], selectedFormats: string[]): SessionImportData[] {
    return sessions.filter(session =>
      session.formats?.some(format =>
        selectedFormats.includes(format.id)
      )
    );
  }

  private filterByCategories(sessions: SessionImportData[], selectedCategories: string[]): SessionImportData[] {
    return sessions.filter(session =>
      session.categories?.some(category =>
        selectedCategories.includes(category.id)
      )
    );
  }

  private filterBySearchTerm(sessions: SessionImportData[], searchTerm: string): SessionImportData[] {
    const searchLower = searchTerm.toLowerCase();

    return sessions.filter(session =>
      session.title?.toLowerCase().includes(searchLower) ||
      session.abstractText?.toLowerCase().includes(searchLower) ||
      session.speakers?.some(speaker =>
        speaker.name?.toLowerCase().includes(searchLower)
      )
    );
  }

  goToPreviousPage(): void {
    if (this.canGoToPreviousPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  goToNextPage(): void {
    if (this.canGoToNextPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }
}
