import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InformationEventComponent } from '../../../components/event/information-event/information-event.component';
import { GeneralInfoEventComponent } from '../../../components/event/general-info-event/general-info-event.component';
import { EventDataService } from '../../../services/event/event-data.service';
import { EventService } from '../../../services/event/event.service';
import { EventDTO } from '../../../type/event/eventDTO';

type PageType = 'pageOne' | 'pageTwo';

@Component({
  selector: 'app-create-event-page',
  standalone: true,
  imports: [
    FormsModule,
    InformationEventComponent,
    GeneralInfoEventComponent
  ],
  templateUrl: './create-event-page.component.html',
  styleUrl: './create-event-page.component.scss'
})
export class CreateEventPageComponent implements OnInit {
  readonly activePage = signal<PageType>('pageOne');
  readonly eventName = signal<string>('');
  readonly teamId = signal<string | null>(null);
  constructor(
    private readonly eventDataService: EventDataService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const teamIdParam = params.get('teamId');
      this.teamId.set(teamIdParam);

      if (teamIdParam) {
        this.eventDataService.updateEventData({ teamId: teamIdParam });
      }
    });

    this.eventDataService.eventName$.subscribe(name => {
      this.eventName.set(name);
    });

    this.eventDataService.nextStep$.subscribe(() => {
      this.activePage.set('pageTwo');
    });
  }

  onGeneralFormSubmitted(eventData: EventDTO): void {
    const sanitizedEventData: EventDTO = {
      ...eventData,
      online: eventData.online ?? false,
      privateEvent: eventData.privateEvent ?? true,
      finished: eventData.finished ?? false,
      timeZone: eventData.timeZone ?? 'Europe/Paris',
      teamUrl: eventData.teamUrl ?? ''
    };

    this.eventService.createEvent(sanitizedEventData).subscribe({
      next: (response: EventDTO) => {
        this.handleEventCreationSuccess(response);
      },
      error: (err) => {
        this.handleEventCreationError(err);
      }
    });
  }

  onGoBack(): void {
    const currentEvent: EventDTO = this.eventDataService.getCurrentEvent();
    const navigationPath = currentEvent.teamId
      ? ['/team', currentEvent.teamId]
      : ['/'];

    this.router.navigate(navigationPath);
  }

  onInformationFormSubmitted(formData: Partial<EventDTO>): void {
    this.eventDataService.updateEventData({
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location,
      description: formData.description,
      online: formData.online,
      webLinkUrl: formData.webLinkUrl,
    });

    const updatedEvent: EventDTO = this.eventDataService.getCurrentEvent();

    if (!updatedEvent.idEvent) {
      console.warn('No event ID found, cannot update event');
      return;
    }

    this.eventService.updateEvent(updatedEvent).subscribe({
      next: (response) => {
        console.log("Event information saved successfully", response);
        this.proceedToNextStep();
      },
      error: (err) => {
        console.error("Error saving event information:", err);
      }
    });
  }

  changePage(page: PageType): void {
    this.activePage.set(page);
  }

  private handleEventCreationSuccess(response: EventDTO): void {
    this.eventDataService.setEventId(response.idEvent || '');
    this.eventDataService.updateEventData({
      conferenceHallUrl: response.conferenceHallUrl,
      url: response.url,
      teamId: response.teamId,
      eventName: response.eventName,
      timeZone: response.timeZone,
      webLinkUrl: response.webLinkUrl,
      privateEvent: response.privateEvent ?? true,
      type: response.type,
    });

    this.eventDataService.goToNextStep();
  }

  private handleEventCreationError(err: any): void {
    console.error('Failed to create event:', err);
    const errorMessage = err.error?.message || err.message || 'Unknown error occurred';
    alert('Failed to create event: ' + errorMessage);
  }

  private proceedToNextStep(): void {
    const currentEvent: EventDTO = this.eventDataService.getCurrentEvent();
    const navigationPath = currentEvent.teamId
      ? ['/team', currentEvent.teamId]
      : ['/events'];

    this.router.navigate(navigationPath);
  }
}
