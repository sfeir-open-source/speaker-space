import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { SessionService } from './session.service';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {SessionImportData} from '../../type/session/session';
import {DurationOption, ScheduleFormValues, SessionScheduleUpdate} from '../../type/session/schedule-json-data';

@Injectable()
export class SessionScheduleFormService {
  private readonly fb = inject(FormBuilder);
  private readonly sessionService = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEditing = signal<boolean>(false);
  readonly isUpdating = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly showDurationDropdown = signal<boolean>(false);
  readonly selectedDuration = signal<number>(60);

  readonly durations: readonly DurationOption[] = this.generateDurations();

  readonly form: FormGroup = this.createForm();

  private generateDurations(): readonly DurationOption[] {
    return [20, 30, 40, 45, 50, 60, 75, 90, 105, 110, 120, 130].map(val => {
      const hours = Math.floor(val / 60);
      const minutes = val % 60;
      let label = '';
      if (hours > 0) label += `${hours} hour${hours > 1 ? 's' : ''}`;
      if (minutes > 0) {
        if (hours > 0) label += ' ';
        label += `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      return { label, value: val } as const;
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      duration: [60, [Validators.required, Validators.min(15)]],
      track: ['', [Validators.maxLength(50)]]
    }, {
      validators: [this.scheduleValidator.bind(this)]
    });
  }

  private scheduleValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const startTime = control.get('startTime')?.value;
    const duration = control.get('duration')?.value;

    if (!startDate || !startTime || !duration) return null;
    if (duration <= 0) return { invalidDuration: true };

    return null;
  }

  populateForm(session: SessionImportData): void {
    const formValues: ScheduleFormValues = {
      track: session.track || '',
      startDate: this.formatDateForInput(session.start),
      startTime: this.formatTimeForInput(session.start),
      duration: 60
    };

    if (session.start && session.end) {
      const durationMinutes = this.calculateDuration(session.start, session.end);
      if (durationMinutes > 0) {
        formValues.duration = durationMinutes;
        this.selectedDuration.set(durationMinutes);
      }
    } else {
      this.selectedDuration.set(60);
    }

    this.form.patchValue(formValues);
  }

  startEditing(session: SessionImportData): void {
    this.isEditing.set(true);
    this.error.set(null);
    this.populateForm(session);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.error.set(null);
    this.showDurationDropdown.set(false);
    this.form.reset();
  }

  selectDuration(duration: number): void {
    this.selectedDuration.set(duration);
    this.form.patchValue({ duration });
    this.showDurationDropdown.set(false);
  }

  saveSchedule(
    eventId: string,
    sessionId: string,
    onSuccess: (session: SessionImportData) => void
  ): void {
    if (this.form.invalid || this.isUpdating()) return;

    const formValues = this.form.value;
    const startDate = this.combineDateAndTime(formValues.startDate, formValues.startTime);

    if (!startDate) {
      this.error.set('Please provide a valid start date and time');
      return;
    }

    const scheduleUpdate: SessionScheduleUpdate = {
      start: startDate,
      end: this.calculateEndDate(startDate, formValues.duration),
      track: formValues.track?.trim() || undefined
    };

    this.isUpdating.set(true);
    this.error.set(null);

    this.sessionService.updateSessionSchedule(eventId, sessionId, scheduleUpdate)
      .pipe(
        finalize(() => this.isUpdating.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updatedSession) => {
          this.isEditing.set(false);
          this.error.set(null);
          onSuccess(updatedSession);
        },
        error: (error) => {
          console.error('Error updating session schedule:', error);
          this.error.set(error.error?.message || 'Failed to update session schedule');
        }
      });
  }

  private formatDateForInput(date?: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  private formatTimeForInput(date?: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    return date.toTimeString().slice(0, 5);
  }

  private calculateDuration(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private calculateEndDate(startDate: Date, durationMinutes: number): Date {
    return new Date(startDate.getTime() + (durationMinutes * 60 * 1000));
  }

  private combineDateAndTime(dateStr: string, timeStr: string): Date | null {
    if (!dateStr || !timeStr) return null;
    const combinedStr = `${dateStr}T${timeStr}:00`;
    const date = new Date(combinedStr);
    return isNaN(date.getTime()) ? null : date;
  }
}
