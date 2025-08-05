import {DestroyRef, inject, Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  Observable,
  Subject,
} from 'rxjs';
import {SaveStatus} from '../../../../core/types/save-status.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class AutoSaveService {
  private readonly DEBOUNCE_TIME : number = 2000;
  private readonly SUCCESS_DISPLAY_TIME : number = 3000;
  private readonly _destroyRef = inject(DestroyRef);

  setupAutoSave<T>(
    form: FormGroup,
    saveFunction: (data: Partial<T>) => Observable<T>,
    options: {
      extractValidFields: () => Partial<T>;
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
        takeUntilDestroyed(this._destroyRef),
        debounceTime(options.debounceTime || this.DEBOUNCE_TIME),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        filter(() => {
          const isValid : boolean = form.valid;
          const isDirty : boolean = form.dirty;
          const hasChanges : boolean = this.hasSignificantChanges(options.extractValidFields());

          return isValid && isDirty && hasChanges;
        })
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

  private hasSignificantChanges(data: any): boolean {
    if (!data) return false;

    const significantFields : string[] = Object.keys(data).filter(key => {
      if (key === 'idEvent') return false;

      const value = data[key];
      return value !== undefined && value !== null && value !== '';
    });

    return significantFields.length > 0;
  }

  private performSave<T>(
    saveFunction: (data: Partial<T>) => Observable<T>,
    data: Partial<T>,
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
        takeUntilDestroyed(this._destroyRef),
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
