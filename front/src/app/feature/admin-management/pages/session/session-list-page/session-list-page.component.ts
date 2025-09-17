import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';

import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonGreyComponent } from '../../../../../shared/button-grey/button-grey.component';
import { Category, Format, SessionImportData, Speaker } from '../../../type/session/session';
import { SessionFilters } from '../../../type/session/session-filters';
import { ButtonGreenActionsComponent } from '../../../../../shared/button-green-actions/button-green-actions.component';
import { SessionUnifiedFilterPopupComponent } from '../../../components/session/session-filter-popup/session-filter-popup.component';
import { BaseListService, ListState } from '../../../components/services/base-list.service';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import { SpeakerService } from '../../../services/speaker/speaker.service';

@Component({
  selector: 'app-session-list-page',
  standalone: true,
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    ButtonGreyComponent,
    ButtonGreenActionsComponent,
    SessionUnifiedFilterPopupComponent,
    AsyncPipe
  ],
  providers: [BaseListService],
  templateUrl: './session-list-page.component.html',
  styleUrl: './session-list-page.component.scss'
})
export class SessionListPageComponent implements OnInit, OnDestroy {
  @Input() icon: string = 'search';

  showFilterPopup: boolean = false;
  availableFormats: Format[] = [];
  availableCategories: Category[] = [];
  Math = Math;
  currentFilters: SessionFilters = {
    selectedFormats: [],
    selectedCategories: []
  };

  readonly listService = inject(BaseListService<SessionImportData>);
  readonly state$: Observable<ListState> = this.listService.state$;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    eventDataService: EventDataService
  ) {
    (this.listService as any).eventService = eventService;
    (this.listService as any).eventDataService = eventDataService;
  }

  ngOnInit(): void {
    this.initializeRouteSubscription();
  }

  ngOnDestroy(): void {
    this.listService.destroy();
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
            const sortedSessions: SessionImportData[] = sessions.sort((a, b) => {
              const titleA: string = a.title?.toLowerCase() || '';
              const titleB: string = b.title?.toLowerCase() || '';
              return titleA.localeCompare(titleB);
            });

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

  get totalSessions(): number {
    return this.listService.getCurrentState().totalItems;
  }

  get isLoadingSessions(): boolean {
    return this.listService.getCurrentState().isLoadingItems;
  }

  get paginatedSessions(): SessionImportData[] {
    return this.listService.getPaginatedItems();
  }

  get currentPage(): number {
    return this.listService.getCurrentState().currentPage;
  }

  get totalPages(): number {
    return this.listService.getCurrentState().totalPages;
  }

  get itemsPerPage(): number {
    return this.listService.getCurrentState().itemsPerPage;
  }

  get pageNumbers(): number[] {
    return this.listService.getPageNumbers();
  }

  get selectAll(): boolean {
    return this.listService.getCurrentState().selectAll;
  }

  get selectedItems(): string[] {
    return this.listService.getCurrentState().selectedItems;
  }

  get searchTerm(): string {
    return this.listService.getCurrentState().searchTerm;
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
    this.listService.goToPage(page);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
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
    this.listService.toggleItemSelection(sessionId);
  }

  toggleSelectAll(): void {
    this.listService.toggleSelectAll((session: SessionImportData) => this.getItemId(session));
  }

  onRowClick(session: SessionImportData, event: Event): void {
    event.preventDefault();

    const target = event.target as HTMLElement;
    const isCheckboxArea = target.closest('.checkbox-area');

    const sessionId : string = this.getItemId(session);
    if (!sessionId) return;

    if (isCheckboxArea) {
      this.toggleSessionSelection(sessionId);
    } else {
      this.openItemDetail(sessionId);
    }
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
    const items = this.listService.getCurrentItems();
    let filtered: SessionImportData[] = [...items];

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

    const searchTerm : string = this.listService.getCurrentState().searchTerm;
    if (searchTerm.trim()) {
      const searchLower: string = searchTerm.toLowerCase();
      filtered = filtered.filter(session =>
        session.title?.toLowerCase().includes(searchLower) ||
        session.abstractText?.toLowerCase().includes(searchLower) ||
        session.speakers?.some(speaker =>
          speaker.name?.toLowerCase().includes(searchLower)
        )
      );
    }

    this.listService.updateFilteredItems(filtered);
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
