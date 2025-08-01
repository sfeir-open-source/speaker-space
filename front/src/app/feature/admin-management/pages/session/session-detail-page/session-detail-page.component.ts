import {Component} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {
  SessionDetailUnifiedComponent
} from '../../../components/session/session-detail-unified/session-detail-unified.component';

@Component({
    selector: 'app-session-detail-page',
  imports: [
    ReactiveFormsModule,
    SessionDetailUnifiedComponent
  ],
    templateUrl: './session-detail-page.component.html',
    styleUrl: './session-detail-page.component.scss'
})
export class SessionDetailPageComponent {}
