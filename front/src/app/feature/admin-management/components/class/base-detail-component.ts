import {DestroyRef, inject, Injectable, OnDestroy, OnInit} from '@angular/core';
import {EventDTO} from '../../type/event/eventDTO';
import {Subject, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {EventService} from '../../services/event/event.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';


@Injectable()
export abstract class BaseDetailComponent implements OnInit, OnDestroy {
  eventId: string = '';
  eventUrl: string = '';
  eventName: string = '';
  teamId: string = '';
  event: EventDTO | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  protected destroy$ = new Subject<void>();
  protected routeSubscription?: Subscription;
  protected readonly destroyRef = inject(DestroyRef);

  constructor(
    protected route: ActivatedRoute,
    protected eventService: EventService
  ) {}

  ngOnInit(): void {
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.routeSubscription?.unsubscribe();
  }

  protected abstract subscribeToRouteParams(): void;

  protected loadEventAndDetailData(): void {
    this.isLoading = true;

    Promise.all([
      this.loadEventData(),
      this.loadDetailData()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  protected loadEventData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventService.getEventById(this.eventId)
        .pipe(
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (event) => {
            this.event = event;
            this.eventUrl = event.url || '';
            this.eventName = event.eventName || '';
            this.teamId = event.teamId || '';
            resolve();
          },
          error: (err) => {
            this.error = 'Failed to load event data';
            reject(err);
          }
        });
    });
  }

  protected abstract loadDetailData(): Promise<void>;

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'img/profil-picture.svg';
  }
}
