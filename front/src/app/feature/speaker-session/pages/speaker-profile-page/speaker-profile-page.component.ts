import {Component} from '@angular/core';
import {
  SpeakerProfileUnifiedComponent
} from '../../../admin-management/components/speaker/speaker-profile-unified/speaker-profile-unified.component';

@Component({
  selector: 'app-speaker-profile-page',
  imports: [
    SpeakerProfileUnifiedComponent
  ],
  templateUrl: './speaker-profile-page.component.html',
  styleUrl: './speaker-profile-page.component.scss'
})
export class SpeakerMyProfilePageComponent {}
