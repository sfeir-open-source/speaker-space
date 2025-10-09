import {Component, input, OnInit, OnDestroy, inject, signal, computed} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Speaker} from '../../../type/session/session';
import { SpeakerWithSessionsDTO } from '../../../type/speaker/speaker-with-sessions';
import { SpeakerService } from '../../../services/speaker/speaker.service';
import { SpeakerFilterPopupComponent } from '../../../components/speaker/speaker-filter-popup/speaker-filter-popup.component';
import { BaseListService } from '../../../components/services/base-list.service';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import { ButtonComponent } from '../../../../../shared/button/button.component';
import { PaginationListComponent } from '../../../components/pagination-list/pagination-list.component';
import { ListState } from '../../../components/type/liste-state';
import { SpeakerFilterService } from '../../../services/speaker/speaker-filter.service';
import { SpeakerFormatterService } from '../../../services/speaker/speaker-formatter.service';
import {
  SpeakerCreatePopupComponent
} from '../../../components/speaker/speaker-create-popup/speaker-create-popup.component';

@Component({
  selector: 'app-speaker-list-page',
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    SpeakerFilterPopupComponent,
    AsyncPipe,
    ButtonComponent,
    PaginationListComponent,
    SpeakerCreatePopupComponent
  ],
  providers: [BaseListService, SpeakerFilterService],
  templateUrl: './speaker-list-page.component.html',
  styleUrl: './speaker-list-page.component.scss'
})
export class SpeakerListPageComponent implements OnInit, OnDestroy {
  readonly icon = input<string>('person');

  readonly showFilterPopup = signal<boolean>(false);
  readonly showCreatePopup = signal<boolean>(false);
  readonly availableTracks = signal<string[]>([]);
  readonly eventStartDate = signal<Date | undefined>(undefined);
  readonly eventEndDate = signal<Date | undefined>(undefined);

  private speakersWithSessions: SpeakerWithSessionsDTO[] = [];

  readonly listService = inject(BaseListService<Speaker>);
  readonly filterService = inject(SpeakerFilterService);
  readonly formatterService = inject(SpeakerFormatterService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly speakerService = inject(SpeakerService);
  private readonly eventService = inject(EventService);

  readonly state$: Observable<ListState> = this.listService.state$;
  readonly totalSpeakers = this.listService.paginationService.totalItemsSignal;
  readonly isLoadingSpeakers = computed(() => this.listService.getCurrentState().isLoadingItems);
  readonly paginatedSpeakers = this.listService.paginationService.paginatedItemsSignal;
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
  onImageError = this.formatterService.handleImageError.bind(this.formatterService);

  readonly Math = Math;

  constructor(eventDataService: EventDataService) {
    (this.listService as any).eventService = this.eventService;
    (this.listService as any).eventDataService = eventDataService;
  }

  ngOnInit(): void {
    this.listService.initializeRouteSubscription(this.route, () => this.loadItems());
  }

  ngOnDestroy(): void {
    this.listService.destroy();
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

            const speakers = speakersWithSessions.map(sws => sws.speaker);
            const sortedSpeakers = this.formatterService.sortByName(speakers);

            this.listService.updateItems(sortedSpeakers);
            this.filterService.extractFiltersFromSpeakers(speakersWithSessions);
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
    const filtered = this.filterService.applyAllFilters( items, this.speakersWithSessions, searchTerm );
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


  isSpeakerSelected(speakerName: string | undefined): boolean {
    if (!speakerName) return false;
    return this.selectedItems().includes(speakerName);
  }

  toggleSpeakerSelection(speakerName: string): void {
    this.listService.toggleItemSelection(speakerName);
  }

  toggleSelectAll(): void {
    this.listService.toggleSelectAll((speaker: Speaker) => this.formatterService.getSpeakerId(speaker) );
  }


  openItemDetail(speakerId: string): void {
    const currentState = this.listService.getCurrentState();
    this.router.navigate(['event', currentState.eventId, 'speaker', speakerId]);
  }

  onCreateSpeaker(): void {
    this.showCreatePopup.set(true);
  }

  onCloseCreatePopup(): void {
    this.showCreatePopup.set(false);
  }

  onSpeakerCreated(): void {
    this.showCreatePopup.set(false);
    this.loadItems();
  }
}
