import {Component, input, OnInit, OnDestroy, inject, computed} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Category, Format, Speaker } from '../../../type/session/session';
import { SpeakerFilters } from '../../../type/speaker/speaker-filters';
import { SpeakerWithSessionsDTO } from '../../../type/speaker/speaker-with-sessions';
import { SpeakerService } from '../../../services/speaker/speaker.service';
import { SpeakerFilterPopupComponent } from '../../../components/speaker/speaker-filter-popup/speaker-filter-popup.component';
import { isDefined } from '../../../../../shared/type/predicates';
import { BaseListService } from '../../../components/services/base-list.service';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import {ButtonComponent} from '../../../../../shared/button/button.component';
import {PaginationListComponent} from '../../../components/pagination-list/pagination-list.component';
import {ListState} from '../../../components/type/liste-state';

@Component({
  selector: 'app-speaker-list-page',
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    SpeakerFilterPopupComponent,
    AsyncPipe,
    ButtonComponent,
    PaginationListComponent
  ],
  providers: [BaseListService],
  templateUrl: './speaker-list-page.component.html',
  styleUrl: './speaker-list-page.component.scss'
})
export class SpeakerListPageComponent implements OnInit, OnDestroy {
  readonly icon = input<string>('person');

  showFilterPopup: boolean = false;
  availableFormats: Format[] = [];
  availableCategories: Category[] = [];
  speakersWithSessions: SpeakerWithSessionsDTO[] = [];

  currentFilters: SpeakerFilters = {
    selectedFormats: [],
    selectedCategories: [],
    hasCompleteTasks: null
  };

  readonly listService = inject(BaseListService<Speaker>);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly speakerService = inject(SpeakerService);
  readonly eventService = inject(EventService);
  readonly eventDataService = inject(EventDataService);

  readonly state$: Observable<ListState> = this.listService.state$;

  readonly Math = Math;

  readonly totalSpeakers = computed(() =>
    this.listService.paginationService.totalItemsSignal()
  );

  readonly isLoadingSpeakers = computed(() =>
    this.listService.getCurrentState().isLoadingItems
  );

  readonly paginatedSpeakers = computed(() =>
    this.listService.paginationService.paginatedItemsSignal()
  );

  readonly totalPages = computed(() =>
    this.listService.paginationService.totalPagesSignal()
  );

  readonly selectAll = computed(() =>
    this.listService.getCurrentState().selectAll
  );

  readonly selectedItems = computed(() =>
    this.listService.getCurrentState().selectedItems
  );

  readonly searchTerm = computed(() =>
    this.listService.getCurrentState().searchTerm
  );

  constructor() {
    (this.listService as any).eventService = this.eventService;
    (this.listService as any).eventDataService = this.eventDataService;
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

    this.listService.updateState({ isLoadingItems: true, error: null });

    return new Promise<void>((resolve, reject) => {
      this.speakerService.getSpeakersWithSessionsByEventId(currentState.eventId)
        .pipe(
          finalize(() => this.listService.updateState({ isLoadingItems: false })),
          takeUntilDestroyed(this.listService['destroyRef'])
        )
        .subscribe({
          next: (speakersWithSessions: SpeakerWithSessionsDTO[]) => {
            this.speakersWithSessions = speakersWithSessions;

            const speakers: Speaker[] = speakersWithSessions.map(sws => sws.speaker);
            const sortedSpeakers: Speaker[] = speakers.sort((a, b) => {
              const nameA: string = a.name?.toLowerCase() || '';
              const nameB: string = b.name?.toLowerCase() || '';
              return nameA.localeCompare(nameB);
            });

            this.listService.updateItems(sortedSpeakers);
            this.extractAvailableFilters();
            resolve();
          },
          error: (error: Error) => {
            console.error('Error loading speakers with sessions:', error);
            this.loadSpeakersWithFallback();
            reject(error);
          }
        });
    });
  }

  private loadSpeakersWithFallback(): void {
    this.listService.updateState({
      error: 'Failed to load speakers. Please check if sessions are imported first.',
      isLoadingItems: false
    });

    this.listService.updateItems([]);
    this.speakersWithSessions = [];
  }

  onFiltersApplied(filters: SpeakerFilters): void {
    this.currentFilters = filters;
    this.applyFilters();
    this.closeFilterPopup();
  }

  onFiltersReset(): void {
    this.currentFilters = {
      selectedFormats: [],
      selectedCategories: [],
      hasCompleteTasks: null
    };
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return this.currentFilters.selectedFormats.length > 0 ||
      this.currentFilters.selectedCategories.length > 0 ||
      this.currentFilters.hasCompleteTasks !== null;
  }

  get activeFiltersCount(): number {
    let count: number = 0;
    count += this.currentFilters.selectedFormats.length;
    count += this.currentFilters.selectedCategories.length;
    if (this.currentFilters.hasCompleteTasks !== null) count += 1;
    return count;
  }

  getItemId(speaker: Speaker): string {
    return speaker.email || '';
  }

  openItemDetail(speakerId: string): void {
    const currentState = this.listService.getCurrentState();
    this.router.navigate(['event', currentState.eventId, 'speaker', speakerId]);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.listService.onSearch(target.value);
    this.applyFilters();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
  }

  onImageError = (event: Event): void => {
    this.listService.handleImageError(event);
  };

  isSpeakerSelected(speakerName: string | undefined): boolean {
    if (!speakerName) return false;
    return this.selectedItems().includes(speakerName);
  }

  toggleSpeakerSelection(speakerName: string): void {
    this.listService.toggleItemSelection(speakerName);
  }

  toggleSelectAll(): void {
    this.listService.toggleSelectAll((speaker: Speaker) => this.getItemId(speaker));
  }

  openFilterPopup(): void {
    this.showFilterPopup = true;
  }

  closeFilterPopup(): void {
    this.showFilterPopup = false;
  }

  private extractAvailableFilters(): void {
    const formatMap = new Map<string, Format>();
    const categoryMap = new Map<string, Category>();

    this.speakersWithSessions.forEach(speakerWithSessions => {
      speakerWithSessions.formats?.forEach(format => {
        if (format.id && !formatMap.has(format.id)) {
          formatMap.set(format.id, format);
        }
      });

      speakerWithSessions.categories?.forEach(category => {
        if (category.id && !categoryMap.has(category.id)) {
          categoryMap.set(category.id, category);
        }
      });
    });

    this.availableFormats = Array.from(formatMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    this.availableCategories = Array.from(categoryMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private applyFilters(): void {
    const items = this.listService.getCurrentItems();
    let filtered: Speaker[] = [...items];

    if (this.currentFilters.selectedFormats.length > 0) {
      filtered = filtered.filter(speaker => {
        const speakerWithSessions = this.speakersWithSessions.find(
          sws => sws.speaker.email === speaker.email || sws.speaker.name === speaker.name
        );

        if (!speakerWithSessions || !speakerWithSessions.formats) {
          return false;
        }

        return speakerWithSessions.formats.some(format =>
          this.currentFilters.selectedFormats.includes(format.id)
        );
      });
    }

    if (this.currentFilters.selectedCategories.length > 0) {
      filtered = filtered.filter(speaker => {
        const speakerWithSessions = this.speakersWithSessions.find(
          sws => sws.speaker.email === speaker.email || sws.speaker.name === speaker.name
        );

        if (!speakerWithSessions || !speakerWithSessions.categories) {
          return false;
        }

        return speakerWithSessions.categories.some(category =>
          this.currentFilters.selectedCategories.includes(category.id)
        );
      });
    }

    if (this.currentFilters.hasCompleteTasks !== null) {
      filtered = filtered.filter(speaker => {
        const isComplete: boolean = isDefined(speaker.name && speaker.email && speaker.company && speaker.bio);
        return this.currentFilters.hasCompleteTasks ? isComplete : !isComplete;
      });
    }

    const searchTerm = this.listService.getCurrentState().searchTerm;
    if (searchTerm.trim()) {
      const searchLower: string = searchTerm.toLowerCase();
      filtered = filtered.filter(speaker =>
        speaker.name?.toLowerCase().includes(searchLower) ||
        speaker.email?.toLowerCase().includes(searchLower) ||
        speaker.company?.toLowerCase().includes(searchLower) ||
        speaker.bio?.toLowerCase().includes(searchLower)
      );
    }

    this.listService.updateFilteredItems(filtered);
  }
}
