import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  SessionListUnifiedComponent
} from '../../../admin-management/components/session/session-list-unified/session-list-unified.component';

@Component({
  selector: 'app-speaker-session-list-page',
  imports: [
    FormsModule,
    SessionListUnifiedComponent,
  ],
  templateUrl: './speaker-session-list-page.component.html',
  styleUrl: './speaker-session-list-page.component.scss'
})
export class SpeakerSessionListPageComponent {}
