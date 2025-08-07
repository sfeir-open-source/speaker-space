import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {SpeakerCreateRequest, SpeakerImportData} from '../../../type/speaker/speaker-create';
import {HttpErrorResponse} from '@angular/common/http';
import {ModalPopupCreateComponent} from '../../modal/modal-popup-create.component';
import {Observable} from 'rxjs';
import {FormModalService} from '../../services/form-modal.service';
import {SpeakerFormFieldsComponent} from '../fields/speaker-form-fields/speaker-form-fields.component';

@Component({
  selector: 'app-speaker-create-popup',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    SpeakerFormFieldsComponent,
    ModalPopupCreateComponent,
  ],
  templateUrl: './speaker-create-popup.component.html',
  styleUrl: './speaker-create-popup.component.scss'
})
export class SpeakerCreatePopupComponent extends FormModalService<any, SpeakerCreateRequest, SpeakerImportData> implements OnInit {
  @Input() eventId!: string;
  @Output() speakerCreated = new EventEmitter<void>();
  @Output() popupClosed = new EventEmitter<void>();

  private readonly speakerService = inject(SpeakerService);

  speakerForm!: FormGroup;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  socialLinks: string[] = [];

  get form(): FormGroup<any> {
    return this.speakerForm;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  protected initializeForm(): void {
    this.speakerForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        this.noWhitespaceValidator
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      bio: ['', [Validators.maxLength(2000)]],
      company: ['', [Validators.maxLength(100)]],
      location: ['', [Validators.maxLength(100)]],
      picture: ['', [Validators.maxLength(500), this.urlValidator]],
      references: ['', [Validators.maxLength(2000)]]
    });
  }

  protected buildCreateRequest(): SpeakerCreateRequest {
    const formValue = this.speakerForm.value;
    return {
      name: formValue.name.trim(),
      email: formValue.email.trim().toLowerCase(),
      bio: this.trimOrUndefined(formValue.bio),
      company: this.trimOrUndefined(formValue.company),
      location: this.trimOrUndefined(formValue.location),
      picture: this.trimOrUndefined(formValue.picture),
      references: this.trimOrUndefined(formValue.references),
      eventId: this.eventId,
      socialLinks: this.socialLinks.length > 0 ? [...this.socialLinks] : undefined
    };
  }

  protected submitRequest(request: SpeakerCreateRequest): Observable<SpeakerImportData> {
    return this.speakerService.createSpeaker(this.eventId, request);
  }

  protected onSuccess(response: SpeakerImportData): void {
    this.speakerCreated.emit();
    this.onClose();
  }

  protected extractErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400 && error.error?.errors) {
      const validationErrors = error.error.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors[0].defaultMessage || validationErrors[0];
      }
    }

    if (error.error?.message) {
      return error.error.message;
    }

    const statusMessages: Record<number, string> = {
      400: 'Invalid data provided. Please check your inputs.',
      409: 'A speaker with this email already exists in this event.',
      403: 'You do not have permission to create speakers for this event.',
      404: 'Event not found.',
      500: 'Server error. Please try again later.'
    };

    return statusMessages[error.status] || 'Failed to create speaker. Please try again.';
  }

  onSocialLinksChange(links: string[]): void {
    this.socialLinks = links;
  }

  onClose(): void {
    if (this.isSubmitting) return;
    this.popupClosed.emit();
  }

  private noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  private urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.trim() === '') {
      return null;
    }
    try {
      new URL(control.value);
      return null;
    } catch {
      return { invalidUrl: true };
    }
  }

  private trimOrUndefined(value: string | null | undefined): string | undefined {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  }
}
