import {Component, Input} from '@angular/core';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {finalize, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {Category, Format, Speaker} from '../../../type/session/session';
import {BaseListComponent} from '../../../components/class/base-list-component';
import {EmailEncoderService} from '../../../components/services/email-encoder.service';
import {SpeakerFilters} from '../../../type/speaker/speaker-filters';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {SpeakerWithSessionsDTO} from '../../../type/speaker/speaker-with-sessions';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {
  SpeakerFilterPopupComponent
} from '../../../components/speaker/speaker-filter-popup/speaker-filter-popup.component';

@Component({
  selector: 'app-speaker-list-page',
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    ButtonGreyComponent,
    ButtonGreenActionsComponent,
    SpeakerFilterPopupComponent,
  ],
  templateUrl: './speaker-list-page.component.html',
  styleUrl: './speaker-list-page.component.scss'
})
export class SpeakerListPageComponent extends BaseListComponent<Speaker> {
  @Input() icon: string = 'person';

  showFilterPopup: boolean = false;
  availableFormats: Format[] = [];
  availableCategories: Category[] = [];
  speakersWithSessions: SpeakerWithSessionsDTO[] = [];

  currentFilters: SpeakerFilters = {
    selectedFormats: [],
    selectedCategories: [],
    hasCompleteTasks: null
  };

  get totalSpeakers(): number {
    return this.totalItems;
  }

  get isLoadingSpeakers(): boolean {
    return this.isLoadingItems;
  }

  get paginatedSpeakers(): Speaker[] {
    return this.paginatedItems;
  }

  Math = Math;

  constructor(
    route: ActivatedRoute,
    router: Router,
    eventService: EventService,
    speakerService : SpeakerService,
    eventDataService: EventDataService,
    private emailEncoderService: EmailEncoderService
  ) {
    super(route, router, eventService, speakerService, eventDataService);
  }

  loadItems(): void {
    if (!this.eventId) return;

    this.isLoadingItems = true;
    this.error = null;

    this.speakerService.getSpeakersWithSessionsByEventId(this.eventId)
      .pipe(
        finalize(() => this.isLoadingItems = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (speakersWithSessions: SpeakerWithSessionsDTO[]) => {
          console.log('Received speakers with sessions:', speakersWithSessions);

          this.speakersWithSessions = speakersWithSessions;

          const speakers : Speaker[] = speakersWithSessions.map(sws => sws.speaker);
          const sortedSpeakers: Speaker[] = speakers.sort((a, b) => {
            const nameA: string = a.name?.toLowerCase() || '';
            const nameB: string = b.name?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
          });

          this.items = sortedSpeakers;
          this.filteredItems = [...sortedSpeakers];
          this.totalItems = sortedSpeakers.length;

          this.extractAvailableFilters();
          this.calculatePagination();
        },
        error: (error) => {
          console.error('Error loading speakers with sessions:', error);
          this.loadSpeakersWithFallback();
        }
      });
  }

  private loadSpeakersWithFallback(): void {
    this.eventService.getSpeakersByEventId(this.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (speakers: Speaker[]) => {
        },
        error: (error) => {
          this.error = 'Failed to load speakers. Please try again.';
        }
      });

    this.error = 'Failed to load speakers. Please check if sessions are imported first.';
    this.items = [];
    this.filteredItems = [];
    this.totalItems = 0;
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

  filterItems(): void {
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return this.currentFilters.selectedFormats.length > 0 ||
      this.currentFilters.selectedCategories.length > 0 ||
      this.currentFilters.hasCompleteTasks !== null;
  }

  get activeFiltersCount(): number {
    let count : number = 0;
    count += this.currentFilters.selectedFormats.length;
    count += this.currentFilters.selectedCategories.length;
    if (this.currentFilters.hasCompleteTasks !== null) count += 1;
    return count;
  }

  getItemId(speaker: Speaker): string {
    return speaker.email || '';
  }

  openItemDetail(speakerId: string): void {
    this.router.navigate(['event', this.eventId, 'speaker', speakerId]);
  }

  isSpeakerSelected(speakerName: string | undefined): boolean {
    if (!speakerName) return false;
    return this.selectedItems.includes(speakerName);
  }

  toggleSpeakerSelection(speakerName: string): void {
    this.toggleItemSelection(speakerName);
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
    let filtered: Speaker[] = [...this.items];

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
        const isComplete: boolean = !!(speaker.name && speaker.email && speaker.company && speaker.bio);
        return this.currentFilters.hasCompleteTasks ? isComplete : !isComplete;
      });
    }

    if (this.searchTerm.trim()) {
      const searchLower: string = this.searchTerm.toLowerCase();
      filtered = filtered.filter(speaker =>
        speaker.name?.toLowerCase().includes(searchLower) ||
        speaker.email?.toLowerCase().includes(searchLower) ||
        speaker.company?.toLowerCase().includes(searchLower) ||
        speaker.bio?.toLowerCase().includes(searchLower)
      );
    }

    this.filteredItems = filtered;
    this.updateItemsAfterFilter();
  }
}
