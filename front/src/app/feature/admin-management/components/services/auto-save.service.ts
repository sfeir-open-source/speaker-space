import { Injectable } from '@angular/core';
import {FormGroup} from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  Observable,
  Subject,
  takeUntil
} from 'rxjs';
import {SaveStatus} from '../../../../core/types/save-status.types';

@Injectable({
  providedIn: 'root'
})
export class AutoSaveService {
  private readonly DEBOUNCE_TIME = 2000;
  private readonly SUCCESS_DISPLAY_TIME = 3000;

  setupAutoSave<T>(
    form: FormGroup,
    saveFunction: (data: T) => Observable<T>,
    options: {
      extractValidFields: () => T;
      onSaveStart?: () => void;
      onSaveSuccess?: (result: T) => void;
      onSaveError?: (error: any) => void;
      debounceTime?: number;
    }
  ): {
    saveStatus$: Observable<SaveStatus>;
    destroy$: Subject<void>;
  } {
    const saveStatusSubject = new BehaviorSubject<SaveStatus>('idle');
    const destroy$ = new Subject<void>();

    form.valueChanges
      .pipe(
        takeUntil(destroy$),
        debounceTime(options.debounceTime || this.DEBOUNCE_TIME),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        filter(() => form.valid && form.dirty) // Ne sauvegarde que si le form est valide et modifié
      )
      .subscribe(() => {
        this.performSave(
          saveFunction,
          options.extractValidFields(),
          saveStatusSubject,
          options
        );
      });

    return {
      saveStatus$: saveStatusSubject.asObservable(),
      destroy$
    };
  }

  private performSave<T>(
    saveFunction: (data: T) => Observable<T>,
    data: T,
    saveStatusSubject: BehaviorSubject<SaveStatus>,
    options: {
      onSaveStart?: () => void;
      onSaveSuccess?: (result: T) => void;
      onSaveError?: (error: any) => void;
    }
  ): void {
    if (saveStatusSubject.value === 'saving') {
      return;
    }

    saveStatusSubject.next('saving');
    options.onSaveStart?.();

    saveFunction(data)
      .pipe(
        finalize(() => {
          if (saveStatusSubject.value === 'saved') {
            setTimeout(() => {
              if (saveStatusSubject.value === 'saved') {
                saveStatusSubject.next('idle');
              }
            }, this.SUCCESS_DISPLAY_TIME);
          }
        })
      )
      .subscribe({
        next: (result) => {
          saveStatusSubject.next('saved');
          options.onSaveSuccess?.(result);
        },
        error: (error) => {
          saveStatusSubject.next('error');
          options.onSaveError?.(error);

          setTimeout(() => {
            if (saveStatusSubject.value === 'error') {
              saveStatusSubject.next('idle');
            }
          }, this.SUCCESS_DISPLAY_TIME);
        }
      });
  }
}
