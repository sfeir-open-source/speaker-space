import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {finalize, Subject, Subscription, takeUntil} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {EventDTO} from '../../../type/event/eventDTO';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {Category, Format, SessionImportData, Speaker} from '../../../type/session/session';
import {SessionDetailPageComponent} from '../session-detail-page/session-detail-page.component';

@Component({
  selector: 'app-session-list-page',
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    ButtonGreyComponent,
    SessionDetailPageComponent,
  ],
  templateUrl: './session-list-page.component.html',
  styleUrl: './session-list-page.component.scss'
})
export class SessionListPageComponent implements OnInit, OnDestroy {
  eventId: string = '';
  eventUrl: string = '';
  eventName: string = '';
  teamUrl: string = '';
  teamId: string = '';
  isLoading: boolean = true;
  error: string | null = null;
  sessions: SessionImportData[] = [];
  filteredSessions: SessionImportData[] = [];
  searchTerm: string = '';
  totalSessions: number = 0;
  isLoadingSessions: boolean = false;
  Math : Math = Math;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  selectedSessions: Set<string> = new Set();
  selectAll: boolean = false;
  currentUserRole: string = '';
  isModalOpen: boolean = false;
  selectedSessionForDetail: SessionImportData | null = null;
  selectedFormat: Format | null = null;
  selectedCategory: Category | null = null;

  @Input() icon: string = 'search';
  @ViewChild(SessionListPageComponent) sessionPageComponent?: SessionListPageComponent;

  private destroy$ = new Subject<void>();
  private routeSubscription?: Subscription;


  constructor(
    private route: ActivatedRoute,
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

          this.loadSessions();
        }
      });
  }

  loadSessions(): void {
    if (!this.eventId) {
      return;
    }

    this.isLoadingSessions = true;

    this.eventService.getSessionsByEventId(this.eventId)
      .pipe(
        finalize(() => this.isLoadingSessions = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (sessions: SessionImportData[]) => {
          console.log('Sessions loaded successfully:', sessions);
          this.sessions = sessions;
          this.filteredSessions = [...sessions];
          this.totalSessions = sessions.length;
          this.calculatePagination();
        },
        error: (err) => {
          console.error('Error loading sessions:', err);
          this.error = 'Failed to load sessions. Please try again.';
          this.sessions = [];
          this.filteredSessions = [];
          this.totalSessions = 0;
        }
      });
  }

  get paginatedSessions(): SessionImportData[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredSessions.slice(startIndex, endIndex);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();
    this.filterSessions();
  }

  private filterSessions(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSessions = [...this.sessions];
    } else {
      this.filteredSessions = this.sessions.filter(session =>
        session.title?.toLowerCase().includes(this.searchTerm) ||
        session.abstract?.toLowerCase().includes(this.searchTerm) ||
        session.speakers?.some(speaker =>
          speaker.name?.toLowerCase().includes(this.searchTerm)
        )
      );
    }

    this.totalSessions = this.filteredSessions.length;
    this.currentPage = 1;
    this.calculatePagination();
  }

  formatSpeakers(speakers: Speaker[] | undefined): string {
    if (!speakers || speakers.length === 0) return 'Aucun speaker';

    return speakers.map(speaker => speaker.name).filter(name => name).join(', ');
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;

    if (this.selectAll) {
      this.paginatedSessions.forEach(session => {
        if (session.id) {
          this.selectedSessions.add(session.id);
        }
      });
    } else {
      this.paginatedSessions.forEach(session => {
        if (session.id) {
          this.selectedSessions.delete(session.id);
        }
      });
    }
  }

  private updateSelectAllState(): void {
    const visibleSessionIds : string[] = this.paginatedSessions
      .map(session => session.id)
      .filter(id => id !== undefined);

    this.selectAll = visibleSessionIds.length > 0 &&
      visibleSessionIds.every(id => this.selectedSessions.has(id!));
  }

  isSessionSelected(sessionId: string | undefined): boolean {
    return sessionId ? this.selectedSessions.has(sessionId) : false;
  }

  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalSessions / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage : number = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage: number = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i : number = startPage; i <= endPage; i++) {
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

  toggleSessionSelection(sessionId: string): void {
    if (this.selectedSessions.has(sessionId)) {
      this.selectedSessions.delete(sessionId);
    } else {
      this.selectedSessions.add(sessionId);
    }
    this.updateSelectAllState();
  }

  onSubmit(event: Event) {
    event.preventDefault();
  }

  onRowClick(sessionId: string, event: Event): void {
    event.preventDefault();

    const target = event.target as HTMLElement;
    const isCheckboxArea = target.closest('.checkbox-area');

    if (isCheckboxArea) {
      this.toggleSessionSelection(sessionId);
    } else {
      this.openSessionDetail(sessionId);
    }
  }

  openSessionDetail(sessionId: string): void {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      this.selectedSessionForDetail = session;

      this.selectedFormat = session.formats && session.formats.length > 0
        ? session.formats[0]
        : null;

      this.selectedCategory = session.categories && session.categories.length > 0
        ? session.categories[0]
        : null;

      this.isModalOpen = true;
      document.body.style.overflow = 'hidden';
    }
  }

  closeSessionDetail(): void {
    this.isModalOpen = false;
    this.selectedSessionForDetail = null;
    this.selectedFormat = null;
    this.selectedCategory = null;

    document.body.style.overflow = 'auto';
  }

  onEditSession(session: SessionImportData): void {
    this.closeSessionDetail();
  }
}
