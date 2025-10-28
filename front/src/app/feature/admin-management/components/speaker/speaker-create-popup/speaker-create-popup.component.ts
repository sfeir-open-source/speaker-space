import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { SpeakerService } from '../../../services/speaker/speaker.service';
import { SpeakerCreateRequest, SpeakerImportData } from '../../../type/speaker/speaker-create';
import { ModalPopupCreateComponent } from '../../modal/modal-popup-create.component';
import { SpeakerFormFieldsComponent } from '../fields/speaker-form-fields/speaker-form-fields.component';
import {FormSubmissionService} from '../../services/create/form-submission.service';
import {SpeakerRequestBuilderService} from '../../services/create/speaker-request-builder.service';
import {SpeakerValidationService} from '../../services/create/speaker-validation.service';
import {SpeakerErrorHandlerService} from '../../services/create/speaker-error-handler.service';

@Component({
  selector: 'app-speaker-create-popup',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    SpeakerFormFieldsComponent,
    ModalPopupCreateComponent,
  ],
  templateUrl: './speaker-create-popup.component.html',
  styleUrl: './speaker-create-popup.component.scss',
  standalone: true,
  providers: [
    FormSubmissionService,
    SpeakerRequestBuilderService
  ]
})
export class SpeakerCreatePopupComponent implements OnInit {
  eventId = input.required<string>();

  speakerCreated = output<void>();
  popupClosed = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly speakerService = inject(SpeakerService);
  private readonly formSubmission = inject(FormSubmissionService<SpeakerCreateRequest, SpeakerImportData>);
  private readonly validationService = inject(SpeakerValidationService);
  private readonly requestBuilder = inject(SpeakerRequestBuilderService);
  private readonly errorHandler = inject(SpeakerErrorHandlerService);

  speakerForm!: FormGroup;
  readonly isSubmitted = signal<boolean>(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  socialLinks = signal<string[]>([]);

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.speakerForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        this.validationService.noWhitespaceValidator
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      bio: ['', [Validators.maxLength(2000)]],
      company: ['', [Validators.maxLength(100)]],
      location: ['', [Validators.maxLength(100)]],
      picture: ['', [
        Validators.maxLength(500),
        Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'),
        this.validationService.urlValidator
      ]],
      references: ['', [Validators.maxLength(2000)]]
    });
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    this.formSubmission.submit({
      form: this.speakerForm,
      isSubmitting: this.isSubmitting,
      errorMessage: this.errorMessage,
      buildRequest: () => this.buildCreateRequest(),
      submitRequest: (request) => this.speakerService.createSpeaker(this.eventId(), request),
      onSuccess: (response) => this.onSuccess(response),
      extractError: (error) => this.errorHandler.extractSpeakerErrorMessage(error)
    });
  }

  private buildCreateRequest(): SpeakerCreateRequest {
    const formValue = this.speakerForm.value;
    return this.requestBuilder.buildCreateRequest(
      formValue,
      this.eventId(),
      this.socialLinks()
    );
  }

  private onSuccess(response: SpeakerImportData): void {
    this.speakerCreated.emit();
    this.onClose();
  }

  onSocialLinksChange(links: string[]): void {
    this.socialLinks.set(links);
  }

  onClose(): void {
    if (this.isSubmitting()) return;
    this.popupClosed.emit();
  }
}
