import {Component, input} from '@angular/core';
import {GeneralInfoEventComponent} from '../general-info-event/general-info-event.component';
import {InformationEventComponent} from '../information-event/information-event.component';
import {EventDTO} from '../../../type/event/eventDTO';
import {EventVisibility} from '../../../type/event/event-visibility';

@Component({
  selector: 'app-event-settings-sections',
  imports: [
    GeneralInfoEventComponent,
    InformationEventComponent
  ],
  templateUrl: './event-settings-sections.component.html',
  styleUrl: './event-settings-sections.component.scss'
})
export class EventSettingsSectionsComponent {
  readonly generalData = input.required<Partial<EventDTO> | null>();
  readonly informationData = input.required<Partial<EventDTO> | null>();
  readonly visibility = input.required<EventVisibility>();
}
