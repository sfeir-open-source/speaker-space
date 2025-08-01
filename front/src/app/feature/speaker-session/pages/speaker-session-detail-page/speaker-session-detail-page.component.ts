import { Component } from '@angular/core';
import {
    SessionDetailUnifiedComponent
} from "../../../admin-management/components/session/session-detail-unified/session-detail-unified.component";

@Component({
  selector: 'app-speaker-session-detail-page',
    imports: [
        SessionDetailUnifiedComponent
    ],
  templateUrl: './speaker-session-detail-page.component.html',
  styleUrl: './speaker-session-detail-page.component.scss'
})
export class SpeakerSessionDetailPageComponent {}
