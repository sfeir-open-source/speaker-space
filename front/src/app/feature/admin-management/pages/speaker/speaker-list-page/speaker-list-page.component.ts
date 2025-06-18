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
export class SpeakerListPageComponent extends BaseListComponent<Speaker> {
  @Input() icon: string = 'person';

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
          const sortedSpeakers = speakers.sort((a, b) => {
            const nameA = a.name?.toLowerCase() || '';
            const nameB = b.name?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
          });

          this.items = sortedSpeakers;
          this.filteredItems = [...sortedSpeakers];
          this.totalItems = sortedSpeakers.length;
          this.calculatePagination();
        },
        error: () => {
          this.items = [];
          this.filteredItems = [];
          this.totalItems = 0;
        }
      });
  }

  getItemId(speaker: Speaker): string {
    return speaker.email || '';
  }

  filterItems(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(speaker =>
        speaker.name?.toLowerCase().includes(this.searchTerm) ||
        speaker.bio?.toLowerCase().includes(this.searchTerm) ||
        speaker.company?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredItems.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

    this.updateItemsAfterFilter();
  }

  openItemDetail(speakerEmail: string): void {
    try {
      const encodedSpeakerEmail = this.emailEncoderService.encodeToBase64(speakerEmail);
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
}
