import {Component, Input} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {FormField} from './interface/form-field';
import {ButtonGreenActionsComponent} from '../button-green-actions/button-green-actions.component';

@Component({
  selector: 'app-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonGreenActionsComponent
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss'
})
export class FormComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() buttonName: string = '';
  @Input() fields: FormField[] = [];

  form!: FormGroup;
  button: boolean = true;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    const formControls: any = {};

    this.fields.forEach(field => {
      formControls[field.name] = [field.value || '', field.required ? Validators.required : []];
    });

    this.form = this.fb.group(formControls);
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
    } else {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }
}
