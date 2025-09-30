import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

export interface TeamFormData {
  teamName: string;
  teamURL: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamFormService {
  private readonly fb = inject(FormBuilder);

  readonly form = signal<FormGroup>(this.createForm());
  readonly isFormValid = signal<boolean>(false);

  private createForm(): FormGroup {
    const form = this.fb.group({
      teamName: [{ value: '', disabled: false }, Validators.required],
      teamURL: { value: '', disabled: true }
    });

    form.statusChanges.subscribe(status => {
      this.isFormValid.set(status === 'VALID');
    });

    return form;
  }

  updateFormData(data: Partial<TeamFormData>): void {
    this.form().patchValue(data);
  }

  getFormControl(name: string): FormControl {
    return this.form().get(name) as FormControl;
  }

  getFormValue(): TeamFormData {
    return this.form().getRawValue();
  }

  updateFormPermissions(userRole: string): void {
    const nameControl = this.form().get('teamName');
    if (!nameControl) return;

    if (userRole !== 'Owner') {
      nameControl.disable();
    } else {
      nameControl.enable();
    }
  }

  setupNameChangeListener(onNameChange: (url: string) => void): Observable<string> {
    const nameControl = this.form().get('teamName');
    if (!nameControl) throw new Error('Team name control not found');

    return nameControl.valueChanges;
  }

  isValid(): boolean {
    return this.form().valid;
  }
}
