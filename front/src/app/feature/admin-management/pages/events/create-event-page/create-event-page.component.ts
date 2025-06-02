import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {InformationEventComponent} from '../../../components/event/information-event/information-event.component';
import {GeneralInfoEventComponent} from '../../../components/event/general-info-event/general-info-event.component';
import {EventDataService} from '../../../services/event/event-data.service';
import {EventService} from '../../../services/event/event.service';
import {EventDTO} from '../../../type/event/eventDTO';

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
  activePage: 'pageOne' | 'pageTwo' = 'pageOne';
  eventName: string = '';
  teamId: string | null = null;

  constructor(
    private eventDataService: EventDataService,
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.teamId = params.get('teamId');
      if (this.teamId) {
        this.eventDataService.updateEventData({ teamId: this.teamId });
      }
    });

    this.eventDataService.eventName$.subscribe(name => {
      this.eventName = name;
    });

    this.eventDataService.nextStep$.subscribe(() => {
      this.activePage = 'pageTwo';
    });
  }

  onGeneralFormSubmitted(eventData: EventDTO): void {
    this.eventService.createEvent(eventData).subscribe({
      next: (response: EventDTO) => {
        this.eventDataService.setEventId(response.idEvent || '');
        this.eventDataService.updateEventData({
          conferenceHallUrl: response.conferenceHallUrl,
          url: response.url,
          teamId: response.teamId,
          eventName: response.eventName,
          timeZone: response.timeZone,
          webLinkUrl: response.webLinkUrl,
          isPrivate: true,
          type : response.type,
        });

        this.eventDataService.goToNextStep();
      },
      error: (err) => {
        console.error('Failed to create event:', err);
        alert('Failed to create event: ' + (err.message || 'Unknown error'));
      }
    });
  }

  onGoBack(): void {
    const currentEvent: EventDTO = this.eventDataService.getCurrentEvent();

    if (currentEvent.teamId) {
      this.router.navigate(['/team', currentEvent.teamId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  onInformationFormSubmitted(formData: any): void {
    this.eventDataService.updateEventData({
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location,
      description: formData.description,
      isOnline: formData.isOnline,
      webLinkUrl: formData.webLinkUrl,
    });

    const updatedEvent: EventDTO = this.eventDataService.getCurrentEvent();

    if (!updatedEvent.idEvent) {
      console.error('Event ID is missing - cannot save event');
      return;
    }

    this.eventService.updateEvent(updatedEvent).subscribe({
      next: (response: any) => {
        console.log("Event information saved successfully", response);
        this.proceedToNextStep();
      },
      error: (err: any) => {
        console.error("Error saving event information:", err);
      }
    });
  }

  private proceedToNextStep(): void {
    const currentEvent : EventDTO = this.eventDataService.getCurrentEvent();

    if (currentEvent.teamId) {
      this.router.navigate(['/team', currentEvent.teamId]);
    } else {
      this.router.navigate(['/events']);
    }
  }

  changePage(page: 'pageOne' | 'pageTwo'): void {
    this.activePage = page;
  }
}
