import {Component} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  SessionListUnifiedComponent
} from '../../../components/session/session-list-unified/session-list-unified.component';

@Component({
  selector: 'app-session-list-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SessionListUnifiedComponent,
  ],
  templateUrl: './session-list-page.component.html',
  styleUrl: './session-list-page.component.scss'
})
export class SessionListPageComponent {}
