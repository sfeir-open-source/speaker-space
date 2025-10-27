import { Component, computed, effect, inject, input, output, signal, DestroyRef } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {IconService} from './service/icon.service';
import {FieldValidationService} from './service/field-validation.service';
import {FieldIconService} from './service/field-icon.service';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss']
})
export class FieldComponent {
  private readonly iconService = inject(IconService);
  private readonly validationService = inject(FieldValidationService);
  private readonly fieldIconService = inject(FieldIconService);
  private readonly destroyRef = inject(DestroyRef);

  readonly iconViewBox = input<string>('0 0 16 16');
  readonly label = input<string | undefined>(undefined);
  readonly paragraph = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly type = input<string>('text');
  readonly control = input.required<AbstractControl>();
  readonly isSubmitted = input<boolean>(false);
  readonly skipAutoValidators = input<boolean>(false);
  readonly required = input<boolean, boolean | undefined>(false, {
    transform: (value: boolean | undefined) => value ?? false
  });
  readonly name = input<string>('');
  readonly errorMessage = input<string>('This field is required');
  readonly disabled = input<boolean, boolean | undefined>(false, {
    transform: (value: boolean | undefined) => value ?? false
  });
  readonly rows = input<number>(6);
  readonly icon = input<string>('');
  readonly iconPath = input<string>('');
  readonly customClass = input<string>('');
  readonly staticPlaceholder = input<string>('');
  readonly minLength = input<number>(2);
  readonly options = input<{ value: string; label: string }[]>([]);

  readonly blur = output<void>();

  private readonly errorTrigger = signal<number>(0);
  readonly errorIcon = signal<Observable<SafeHtml> | null>(null);

  readonly formControl = computed(() => this.control() as FormControl);

  readonly effectivePlaceholder = computed(() => {
    const staticPlaceholder = this.staticPlaceholder();
    const placeholder = this.placeholder();

    if (staticPlaceholder && staticPlaceholder !== '') {
      return staticPlaceholder;
    }
    if (placeholder && placeholder !== 'undefined') {
      return placeholder;
    }
    return '';
  });

  readonly isTextarea = computed(() => this.type() === 'textarea');
  readonly isSelect = computed(() => this.type() === 'select');
  readonly hasIcon = computed(() => {
    const icon = this.icon();
    return icon !== undefined && icon !== '';
  });

  readonly hasError = computed(() => {
    this.errorTrigger();
    return this.validationService.hasVisibleError(this.control(), this.isSubmitted());
  });

  readonly errorMessages = computed(() => {
    this.errorTrigger();

    if (!this.hasError() || !this.control()) {
      return [];
    }

    return this.validationService.getErrorMessages(
      this.control().errors,
      this.name(),
      this.errorMessage()
    );
  });

  readonly sanitizedIcon = computed(() => {
    const iconPath = this.iconPath();
    const viewBox = this.iconViewBox();
    return this.fieldIconService.sanitizeSvgPath(iconPath, viewBox);
  });

  constructor() {
    this.initializeErrorIcon();
    this.setupControlChangeTracking();
    this.setupAutoValidators();
  }

  private initializeErrorIcon(): void {
    this.errorIcon.set(this.iconService.getIcon('error-outline'));
  }

  private setupControlChangeTracking(): void {
    effect(() => {
      const control = this.control();
      if (!control) return;

      control.statusChanges
        ?.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.errorTrigger.update(v => v + 1));

      control.valueChanges
        ?.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.errorTrigger.update(v => v + 1));
    }, { allowSignalWrites: true });
  }

  private setupAutoValidators(): void {
    effect(() => {
      if (this.skipAutoValidators()) {
        return;
      }

      const control = this.control();
      if (!control) {
        return;
      }

      try {
        const validators = this.validationService.buildAutoValidators({
          required: this.required(),
          minLength: this.minLength(),
          type: this.type(),
          name: this.name()
        });

        control.setValidators(validators.length > 0 ? validators : null);
        control.updateValueAndValidity({ emitEvent: false });

      } catch (error) {
        console.error(`Error applying validators for field '${this.name()}':`, error);
      }
    });
  }

  onInputBlur(): void {
    const control = this.control();
    if (control) {
      control.markAsTouched();
    }
    this.blur.emit();
  }
}
