import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {finalize, Subject, Subscription, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {EventDTO} from '../../../type/event/eventDTO';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {Speaker} from '../../../type/session/session';

@Component({
  selector: 'app-speaker-list-page',
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    ButtonGreyComponent,
  ],
  templateUrl: './speaker-list-page.component.html',
  styleUrl: './speaker-list-page.component.scss'
})
export class SpeakerListPageComponent implements OnInit, OnDestroy {
  eventId: string = '';
  eventUrl: string = '';
  eventName: string = '';
  teamUrl: string = '';
  teamId: string = '';
  isLoading: boolean = true;
  error: string | null = null;

  speakers: Speaker[] = [];
  filteredSpeakers: Speaker[] = [];

  searchTerm: string = '';
  totalSpeakers: number = 0;
  isLoadingSpeakers: boolean = false;
  Math: Math = Math;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  selectedSpeakers: Set<string> = new Set();
  selectAll: boolean = false;
  currentUserRole: string = '';

  @Input() icon: string = 'person';

  private destroy$ = new Subject<void>();
  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private eventDataService: EventDataService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.currentUserRole = 'Owner';
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.routeSubscription?.unsubscribe();
  }

  private subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.eventId = params.get('eventId') || '';

      if (this.eventId) {
        this.loadEventData();
      } else {
        this.error = 'Event ID is missing from route parameters';
        this.isLoading = false;
      }
    });
  }

  loadEventData(): void {
    if (!this.eventId) {
      this.error = 'Event ID is required to load event data';
      this.isLoading = false;
      return;
    }

    this.eventService.getEventById(this.eventId)
      .pipe(
        finalize(() => this.isLoading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (event: EventDTO) => {
          this.handleEventDataLoaded(event);
          this.eventUrl = event.url || '';

          this.eventDataService.loadEvent({
            idEvent: event.idEvent || this.eventId,
            eventName: event.eventName || '',
            teamId: event.teamId || '',
            url: event.url || '',
            teamUrl: event.teamUrl,
            type: event.type,
          });

          this.loadSpeakers();
        },
        error: (err) => {
          console.error('Error loading event:', err);
          this.error = 'Failed to load event data. Please try again.';
        }
      });
  }

  loadSpeakers(): void {
    if (!this.eventId) {
      return;
    }

    this.isLoadingSpeakers = true;

    this.eventService.getSpeakersByEventId(this.eventId)
      .pipe(
        finalize(() => this.isLoadingSpeakers = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (speakers: Speaker[]) => {
          console.log('Speakers loaded successfully:', speakers);

          const sortedSpeakers : Speaker[] = speakers.sort((a, b) => {
            const nameA : string = a.name?.toLowerCase() || '';
            const nameB : string = b.name?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
          });

          this.speakers = sortedSpeakers;
          this.filteredSpeakers = [...sortedSpeakers];
          this.totalSpeakers = sortedSpeakers.length;
          this.calculatePagination();
        },
        error: (err) => {
          console.error('Error loading speakers:', err);
          this.speakers = [];
          this.filteredSpeakers = [];
          this.totalSpeakers = 0;
        }
      });
  }

  get paginatedSpeakers(): Speaker[] {
    const startIndex : number = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex : number = startIndex + this.itemsPerPage;
    return this.filteredSpeakers.slice(startIndex, endIndex);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();
    this.filterSpeakers();
  }

  private filterSpeakers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSpeakers = [...this.speakers];
    } else {
      this.filteredSpeakers = this.speakers.filter(speaker =>
        speaker.name?.toLowerCase().includes(this.searchTerm) ||
        speaker.bio?.toLowerCase().includes(this.searchTerm) ||
        speaker.company?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredSpeakers.sort((a, b) => {
      const nameA : string = a.name?.toLowerCase() || '';
      const nameB : string = b.name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

    this.totalSpeakers = this.filteredSpeakers.length;
    this.currentPage = 1;
    this.calculatePagination();
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;

    if (this.selectAll) {
      this.paginatedSpeakers.forEach(speaker => {
        if (speaker.name) {
          this.selectedSpeakers.add(speaker.name);
        }
      });
    } else {
      this.paginatedSpeakers.forEach(speaker => {
        if (speaker.name) {
          this.selectedSpeakers.delete(speaker.name);
        }
      });
    }
  }

  private updateSelectAllState(): void {
    const visibleSpeakerNames: string[] = this.paginatedSpeakers
      .map(speaker => speaker.name)
      .filter(name => name !== undefined) as string[];

    this.selectAll = visibleSpeakerNames.length > 0 &&
      visibleSpeakerNames.every(name => this.selectedSpeakers.has(name));
  }

  isSpeakerSelected(speakerName: string | undefined): boolean {
    return speakerName ? this.selectedSpeakers.has(speakerName) : false;
  }

  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalSpeakers / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage: number = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage: number = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i: number = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  private handleEventDataLoaded(event: any): void {
    this.eventId = event.idEvent || this.eventId;
    this.eventName = event.eventName || '';
    this.eventUrl = event.url || '';
    this.teamUrl = event.teamUrl || '';
    this.teamId = event.teamId || '';
    this.currentUserRole = 'Owner';
    this.error = null;
  }

  toggleSpeakerSelection(speakerName: string): void {
    if (this.selectedSpeakers.has(speakerName)) {
      this.selectedSpeakers.delete(speakerName);
    } else {
      this.selectedSpeakers.add(speakerName);
    }
    this.updateSelectAllState();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
  }

  onRowClick(speakerName: string, event: Event): void {
    event.preventDefault();

    const target = event.target as HTMLElement;
    const isCheckboxArea = target.closest('.checkbox-area');

    if (isCheckboxArea) {
      this.toggleSpeakerSelection(speakerName);
    } else {
      this.openSpeakerDetail(speakerName);
    }
  }

  openSpeakerDetail(speakerName: string): void {
    console.log('Open speaker detail for:', speakerName);

    const encodedSpeakerName : string = encodeURIComponent(speakerName);

    this.router.navigate(['event', this.eventId, 'speaker', encodedSpeakerName]);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'img/profil-picture.svg';
  }
}
