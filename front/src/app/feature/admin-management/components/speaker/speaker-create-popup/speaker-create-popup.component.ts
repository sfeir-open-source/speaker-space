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
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {finalize} from 'rxjs/operators';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {SpeakerCreateRequest} from '../../../type/speaker/speaker-create';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-speaker-create-popup',
  imports: [
    ButtonGreenActionsComponent,
    ButtonGreyComponent,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './speaker-create-popup.component.html',
  styleUrl: './speaker-create-popup.component.scss'
})
export class SpeakerCreatePopupComponent implements OnInit {
  @Input() eventId!: string;
  @Output() speakerCreated = new EventEmitter<void>();
  @Output() popupClosed = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly speakerService = inject(SpeakerService);

  speakerForm!: FormGroup;
  isCreating : boolean = false;
  errorMessage: string | null = null;
  socialLinks: string[] = [];
  newSocialLink : string = '';

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
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

  addSocialLink(): void {
    const link : string = this.newSocialLink.trim();
    if (!link) return;

    if (this.socialLinks.includes(link)) {
      this.showTemporaryError('This social link already exists');
      return;
    }

    if (!this.isValidUrl(link)) {
      this.showTemporaryError('Please enter a valid URL');
      return;
    }

    if (this.socialLinks.length >= 5) {
      this.showTemporaryError('Maximum 5 social links allowed');
      return;
    }

    this.socialLinks.push(link);
    this.newSocialLink = '';
  }

  removeSocialLink(index: number): void {
    if (index >= 0 && index < this.socialLinks.length) {
      this.socialLinks.splice(index, 1);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  private showTemporaryError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = null;
      }
    }, 3000);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.speakerForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.speakerForm.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    const errors = field.errors;

    if (errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `${this.getFieldDisplayName(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} must not exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['whitespace']) return `${this.getFieldDisplayName(fieldName)} cannot be empty or contain only spaces`;
    if (errors['invalidUrl']) return 'Please enter a valid URL (starting with http:// or https://)';

    return 'Invalid input';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      bio: 'Biography',
      company: 'Company',
      location: 'Location',
      picture: 'Picture URL',
      references: 'References'
    };
    return displayNames[fieldName] || fieldName;
  }

  onSubmit(): void {
    if (this.isCreating) return;

    if (this.speakerForm.invalid) {
      this.markAllFieldsAsTouched();
      this.showTemporaryError('Please fix the errors above');
      return;
    }

    this.createSpeaker();
  }

  private createSpeaker(): void {
    const formValue = this.speakerForm.value;
    this.isCreating = true;
    this.errorMessage = null;

    const speakerData: SpeakerCreateRequest = {
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

    this.speakerService.createSpeaker(this.eventId, speakerData)
      .pipe(
        finalize(() => this.isCreating = false)
      )
      .subscribe({
        next: () => {
          this.speakerCreated.emit();
          this.onClose();
        },
        error: (error) => {
          console.error('Error creating speaker:', error);
          this.errorMessage = this.extractErrorMessage(error);
        }
      });
  }

  private trimOrUndefined(value: string | null | undefined): string | undefined {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.speakerForm.controls).forEach(key => {
      this.speakerForm.get(key)?.markAsTouched();
    });
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
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

  onClose(): void {
    if (this.isCreating) return;
    this.popupClosed.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget && !this.isCreating) {
      this.onClose();
    }
  }
}
