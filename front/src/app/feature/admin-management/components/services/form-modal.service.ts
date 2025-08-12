import {DestroyRef, inject, Injectable} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {finalize} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export abstract class FormModalService<TForm extends { [K in keyof TForm]: AbstractControl<any, any>; }, TCreateRequest, TResponse> {
  protected readonly fb = inject(FormBuilder);

  abstract form: FormGroup<TForm>;
  abstract isSubmitting: boolean;
  abstract errorMessage: string | null;

  protected abstract initializeForm(): void;
  protected abstract buildCreateRequest(): TCreateRequest;
  protected abstract submitRequest(request: TCreateRequest): Observable<TResponse>;
  protected abstract onSuccess(response: TResponse): void;
  protected abstract extractErrorMessage(error: HttpErrorResponse): string;
  protected readonly _destroyRef = inject(DestroyRef);

  onSubmit(): void {
    if (this.isSubmitting || this.form.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const request = this.buildCreateRequest();

    this.submitRequest(request)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => this.onSuccess(response),
        error: (error) => {
          console.error('Form submission error:', error);
          this.errorMessage = this.extractErrorMessage(error);
        }
      });
  }

  protected markAllFieldsAsTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }
}
