import {finalize, Subject, Subscription, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../services/event/event.service';
import {EventDataService} from '../../services/event/event-data.service';
import {OnDestroy, OnInit, Injectable} from '@angular/core';
import {EventDTO} from '../../type/event/eventDTO';

@Injectable()
export abstract class BaseListComponent<T> implements OnInit, OnDestroy {
  eventId: string = '';
  eventUrl: string = '';
  eventName: string = '';
  teamUrl: string = '';
  teamId: string = '';
  isLoading: boolean = true;
  error: string | null = null;

  items: T[] = [];
  filteredItems: T[] = [];
  searchTerm: string = '';
  totalItems: number = 0;
  isLoadingItems: boolean = false;

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  selectedItems: string[] = [];
  selectAll: boolean = false;
  currentUserRole: string = 'Owner';

  protected destroy$ = new Subject<void>();
  protected routeSubscription?: Subscription;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected eventService: EventService,
    protected eventDataService: EventDataService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.routeSubscription?.unsubscribe();
  }

  protected subscribeToRouteParams(): void {
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

  protected loadEventData(): void {
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
          this.eventDataService.loadEvent({
            idEvent: event.idEvent || this.eventId,
            eventName: event.eventName || '',
            teamId: event.teamId || '',
            url: event.url || '',
            teamUrl: event.teamUrl,
            type: event.type,
          });
          this.loadItems();
        },
        error: (err) => {
          this.error = 'Failed to load event data. Please try again.';
        }
      });
  }

  protected handleEventDataLoaded(event: EventDTO): void {
    this.eventId = event.idEvent || this.eventId;
    this.eventName = event.eventName || '';
    this.eventUrl = event.url || '';
    this.teamUrl = event.teamUrl || '';
    this.teamId = event.teamId || '';
    this.error = null;
  }

  abstract loadItems(): void;
  abstract getItemId(item: T): string;
  abstract filterItems(): void;
  abstract openItemDetail(itemId: string): void;

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();
    this.filterItems();
  }

  protected calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onRowClick(item: T, event: Event): void {
    event.preventDefault();

    const target = event.target as HTMLElement;
    const isCheckboxArea = target.closest('.checkbox-area');

    const itemId = this.getItemId(item);
    if (!itemId) return;

    if (isCheckboxArea) {
      this.toggleItemSelection(itemId);
    } else {
      this.openItemDetail(itemId);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'img/profil-picture.svg';
  }

  get paginatedItems(): T[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredItems.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  toggleItemSelection(itemId: string): void {
    const index = this.selectedItems.indexOf(itemId);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(itemId);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.paginatedItems
        .map(item => this.getItemId(item))
        .filter(id => id !== '');
    }
    this.selectAll = !this.selectAll;
  }

  private updateSelectAllState(): void {
    const visibleItemIds = this.paginatedItems
      .map(item => this.getItemId(item))
      .filter(id => id !== '');

    this.selectAll = visibleItemIds.length > 0 &&
      visibleItemIds.every(id => this.selectedItems.includes(id));
  }

  updateItemsAfterFilter(): void {
    this.totalItems = this.filteredItems.length;
    this.currentPage = 1;
    this.calculatePagination();
    this.selectedItems = [];
    this.selectAll = false;
  }
}
