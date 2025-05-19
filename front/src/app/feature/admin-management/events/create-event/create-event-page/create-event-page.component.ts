import {Component, OnInit} from '@angular/core';
import {CreateNewEventComponent} from '../components/create-new-event/create-new-event.component';
import {FormsModule} from '@angular/forms';
import {InformationEventComponent} from '../components/information-event/information-event.component';
import {EventDataService} from '../../../services/event/event-data.service';

@Component({
  selector: 'app-create-event-page',
  standalone: true,
  imports: [
    FormsModule,
    CreateNewEventComponent,
    InformationEventComponent
  ],
  templateUrl: './create-event-page.component.html',
  styleUrl: './create-event-page.component.scss'
})
export class CreateEventPageComponent implements OnInit {
  activePage: 'pageOne' | 'pageTwo' = 'pageOne';
  eventName: string = '';

  constructor(private eventDataService: EventDataService) {}

  ngOnInit(): void {
    this.eventDataService.eventName$.subscribe(name => {
      this.eventName = name;
    });

    this.eventDataService.nextStep$.subscribe(() => {
      this.activePage = 'pageTwo';
    });
  }

  changePage(page: 'pageOne' | 'pageTwo'): void {
    this.activePage = page;
  }
}
