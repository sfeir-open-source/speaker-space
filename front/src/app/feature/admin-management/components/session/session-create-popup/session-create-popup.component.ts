import {Component, OnInit, inject, input, output, effect, signal} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {Category, Format, SessionImportData, Speaker} from '../../../type/session/session';
import { ModalPopupCreateComponent } from '../../modal/modal-popup-create.component';
import { SessionFormFieldsComponent } from '../fields/session-form-fields/session-form-fields.component';
import { FormSubmissionService } from '../../services/create/form-submission.service';
import { SessionRequestBuilderService } from '../../services/create/session-request-builder.service';
import {SessionCreateStateService} from '../../../services/sessions/session-create-state.service';

@Component({
  selector: 'app-session-create-popup',
  templateUrl: './session-create-popup.component.html',
  imports: [
    ModalPopupCreateComponent,
    ReactiveFormsModule,
    SessionFormFieldsComponent
  ],
  standalone: true,
  providers: [
    SessionCreateStateService,
    FormSubmissionService,
    SessionRequestBuilderService
  ]
})
export class SessionCreatePopupComponent implements OnInit {
  eventId = input.required<string>();
  availableFormats = input<Format[]>([]);
  availableCategories = input<Category[]>([]);
  availableTracks = input<string[]>([]);
  eventStartDate = input<Date | undefined>(undefined);
  eventEndDate = input<Date | undefined>(undefined);

  sessionCreated = output<void>();
  popupClosed = output<void>();

  protected readonly state = inject(SessionCreateStateService);

  readonly isSubmitted = signal<boolean>(false);

  constructor() {
    effect(() => {
      const emptySession = this.state.matchingEmptySession();
      if (emptySession) {
        this.state.prefillFormFromEmptySession(emptySession);
      }
    });
  }

  ngOnInit(): void {
    this.state.initialize({
      eventId: this.eventId(),
      availableFormats: this.availableFormats(),
      availableCategories: this.availableCategories(),
      eventStartDate: this.eventStartDate(),
      eventEndDate: this.eventEndDate()
    });
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    this.state.submit((response: SessionImportData) => {
      this.sessionCreated.emit();
      this.onClose();
    });
  }

  onClose(): void {
    if (this.state.isSubmitting()) return;
    this.popupClosed.emit();
  }

  onDurationChange(duration: number): void {
    this.state.selectedDuration.set(duration);
  }

  onSpeakersChange(speakers: Speaker[]): void {
    this.state.selectedSpeakers.set(speakers);
  }

  onFormatsChange(formats: string[]): void {
    this.state.selectedFormats.set(formats);
  }

  onCategoriesChange(categories: string[]): void {
    this.state.selectedCategories.set(categories);
  }

  onLanguagesChange(languages: string[]): void {
    this.state.selectedLanguages.set(languages);
  }
}
