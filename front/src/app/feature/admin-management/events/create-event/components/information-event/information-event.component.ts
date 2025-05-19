import { Component } from '@angular/core';
import {
  ButtonGreenActionsComponent
} from '../../../../../../shared/button-green-actions/button-green-actions.component';
import {ButtonGreyComponent} from '../../../../../../shared/button-grey/button-grey.component';
import {InputComponent} from '../../../../../../shared/input/input.component';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {FormField} from '../../../../../../shared/input/interface/form-field';
import {ActivatedRoute} from '@angular/router';
import {EventDataService} from '../../../../services/event/event-data.service';

@Component({
  selector: 'app-information-event',
  standalone: true,
  imports: [
    ButtonGreenActionsComponent,
    ButtonGreyComponent,
    ReactiveFormsModule,
    FormsModule,
    InputComponent
  ],
  templateUrl: './information-event.component.html',
  styleUrl: './information-event.component.scss'
})
export class InformationEventComponent {
  isSubmitted: boolean = false;
  form: FormGroup;
  eventId: string = '';
  eventName: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private eventDataService: EventDataService
  ) {
    this.form = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.eventDataService.eventId$.subscribe(id => {
      this.eventId = id;
    });

    this.eventDataService.eventName$.subscribe(name => {
      this.eventName = name;
    });
  }

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.form.invalid) {
      return;
    }

  }

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  formFields: FormField[] = [
    {
      name: 'startDate',
      label: 'Start date',
      placeholder: 'jj/mm/aaaa',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      label: 'End date',
      placeholder: 'jj/mm/aaaa',
      type: 'date',
      required: true,
    }
  ];

  additionalFields: FormField[] = [
    { name: 'venueLocation', label: 'Venue location (address, city, country)', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' }
  ];
}
