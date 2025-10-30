import {Component, HostListener, inject, input, output} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {ButtonComponent} from '../../../../../shared/button/button.component';
import {SessionScheduleFormService} from '../../../services/sessions/session-schedule-form.service';
import {IconAlertComponent} from '../../../../../shared/icon-alert/icon-alert.component';
import {IconName} from '../../../../../shared/icon-alert/service/icon.service';

@Component({
  selector: 'app-session-schedule-form',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    IconAlertComponent
  ],
  templateUrl: './session-schedule-form.component.html',
  standalone: true,
  styleUrl: './session-schedule-form.component.scss'
})
export class SessionScheduleFormComponent {
  readonly formService = inject(SessionScheduleFormService);

  readonly availableTracks = input.required<string[]>();
  readonly save = output<void>();
  readonly cancel = output<void>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.formService.showDurationDropdown.set(false);
    }
  }

  onSubmit(): void {
    this.save.emit();
  }

  protected readonly IconName = IconName;
}
