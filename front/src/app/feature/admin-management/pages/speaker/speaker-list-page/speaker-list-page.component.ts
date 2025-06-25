import {Component, Input} from '@angular/core';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {finalize, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {Speaker} from '../../../type/session/session';
import {BaseListComponent} from '../../../components/class/base-list-component';
import {EmailEncoderService} from '../../../components/services/email-encoder.service';
import {SpeakerFilters} from '../../../type/speaker/speaker-filters';
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
    SpeakerFilterPopupComponent,
  ],
  templateUrl: './speaker-list-page.component.html',
  styleUrl: './speaker-list-page.component.scss'
})
export class SpeakerListPageComponent extends BaseListComponent<Speaker> {
  @Input() icon: string = 'person';

  showFilterPopup: boolean = false;
  availableCompanies: string[] = [];

  currentFilters: SpeakerFilters = {
    selectedCompanies: [],
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
    eventDataService: EventDataService,
    private emailEncoderService: EmailEncoderService
  ) {
    super(route, router, eventService, eventDataService);
  }

  loadItems(): void {
    if (!this.eventId) return;

    this.isLoadingItems = true;

    this.eventService.getSpeakersByEventId(this.eventId)
      .pipe(
        finalize(() => this.isLoadingItems = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (speakers: Speaker[]) => {
          const sortedSpeakers: Speaker[] = speakers.sort((a, b) => {
            const nameA: string = a.name?.toLowerCase() || '';
            const nameB: string = b.name?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
          });

          this.items = sortedSpeakers;
          this.filteredItems = [...sortedSpeakers];
          this.totalItems = sortedSpeakers.length;

          this.extractAvailableFilters(speakers);

          this.calculatePagination();
        },
        error: () => {
          this.items = [];
          this.filteredItems = [];
          this.totalItems = 0;
        }
      });
  }

  private extractAvailableFilters(speakers: Speaker[]): void {
    const companiesSet = new Set<string>();
    speakers.forEach(speaker => {
      if (speaker.company && speaker.company.trim()) {
        companiesSet.add(speaker.company.trim());
      }
    });
    this.availableCompanies = Array.from(companiesSet).sort();
  }

  private applyFilters(): void {
    let filtered: Speaker[] = [...this.items];

    if (this.currentFilters.selectedCompanies.length > 0) {
      filtered = filtered.filter(speaker =>
        speaker.company &&
        this.currentFilters.selectedCompanies.includes(speaker.company.trim())
      );
    }

    if (this.currentFilters.hasCompleteTasks !== null) {
      filtered = filtered.filter(speaker => {
        const isComplete : boolean = !!(speaker.name && speaker.email && speaker.company && speaker.bio);
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

  onFiltersApplied(filters: SpeakerFilters): void {
    this.currentFilters = filters;
    this.applyFilters();
    this.closeFilterPopup();
  }

  onFiltersReset(): void {
    this.currentFilters = {
      selectedCompanies: [],
      hasCompleteTasks: null
    };
    this.applyFilters();
  }

  filterItems(): void {
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return this.currentFilters.selectedCompanies.length > 0 ||
      this.currentFilters.hasCompleteTasks !== null;
  }

  get activeFiltersCount(): number {
    let count : number = 0;
    count += this.currentFilters.selectedCompanies.length;
    if (this.currentFilters.hasCompleteTasks !== null) count += 1;
    return count;
  }

  getItemId(speaker: Speaker): string {
    return speaker.email || '';
  }

  openItemDetail(speakerEmail: string): void {
    try {
      const encodedSpeakerEmail : string = this.emailEncoderService.encodeToBase64(speakerEmail);
      this.router.navigate(['event', this.eventId, 'speaker', encodedSpeakerEmail]);
    } catch (error) {
      console.error('Error encoding email for navigation:', error);
    }
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
}
