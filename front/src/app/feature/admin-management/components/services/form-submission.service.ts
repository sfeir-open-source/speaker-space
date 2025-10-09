import { Injectable, inject, DestroyRef, signal, WritableSignal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

@Injectable()
export class FormSubmissionService<TRequest, TResponse> {
  private readonly destroyRef = inject(DestroyRef);

  submit(config: {
    form: FormGroup;
    isSubmitting: WritableSignal<boolean>;
    errorMessage: WritableSignal<string | null>;
    buildRequest: () => TRequest;
    submitRequest: (request: TRequest) => Observable<TResponse>;
    onSuccess: (response: TResponse) => void;
    extractError: (error: HttpErrorResponse) => string;
  }): void {
    const { form, isSubmitting, errorMessage, buildRequest, submitRequest, onSuccess, extractError } = config;

    if (isSubmitting() || form.invalid) {
      this.markAllFieldsAsTouched(form);
      return;
    }

    isSubmitting.set(true);
    errorMessage.set(null);

    const request = buildRequest();

    submitRequest(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => onSuccess(response),
        error: (error: HttpErrorResponse) => {
          console.error('Form submission error:', error);
          errorMessage.set(extractError(error));
        }
      });
  }

  private markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }
}
