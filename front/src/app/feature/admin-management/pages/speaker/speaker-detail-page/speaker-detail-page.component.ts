import {Component} from '@angular/core';
import {
  SpeakerProfileUnifiedComponent
} from '../../../components/speaker/speaker-profile-unified/speaker-profile-unified.component';

@Component({
    selector: 'app-speaker-detail-page',
  imports: [
    SpeakerProfileUnifiedComponent,
  ],
    templateUrl: './speaker-detail-page.component.html',
    styleUrl: './speaker-detail-page.component.scss'
})
export class SpeakerDetailPageComponent {}
