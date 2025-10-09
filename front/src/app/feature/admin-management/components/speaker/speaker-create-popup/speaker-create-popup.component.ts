// components/speaker-create-popup.component.ts
import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
  DestroyRef
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
import { FormSubmissionService } from '../../services/form-submission.service';
import {SpeakerRequestBuilderService} from '../../services/speaker-request-builder.service';
import {SpeakerValidationService} from '../../services/speaker-validation.service';
import {SpeakerErrorHandlerService} from '../../services/speaker-error-handler.service';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly speakerService = inject(SpeakerService);
  private readonly formSubmission = inject(FormSubmissionService<SpeakerCreateRequest, SpeakerImportData>);
  private readonly validationService = inject(SpeakerValidationService);
  private readonly requestBuilder = inject(SpeakerRequestBuilderService);
  private readonly errorHandler = inject(SpeakerErrorHandlerService);

  speakerForm!: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  socialLinks = signal<string[]>([]);

  isFormValid = computed(() =>
    this.speakerForm?.valid && !this.isSubmitting()
  );

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
        this.validationService.urlValidator
      ]],
      references: ['', [Validators.maxLength(2000)]]
    });
  }

  onSubmit(): void {
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
