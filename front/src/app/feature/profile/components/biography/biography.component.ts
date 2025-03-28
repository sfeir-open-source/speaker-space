import { Component } from '@angular/core';
import {FormControl} from '@angular/forms';
import {InputComponent} from '../../../../shared/input/input.component';
import {FormField} from '../../../../shared/input/interface/form-field';
import {ProfileService} from '../../service/profile.service';

@Component({
  selector: 'app-biography',
  imports: [
    InputComponent
  ],
  templateUrl: './biography.component.html',
  styleUrl: './biography.component.scss'
})
export class BiographyComponent {
  biographyField: FormField = {
    name: 'biographySpeaker',
    label: 'Biography Speaker',
    type: 'textarea',
  };

  constructor(private profileService: ProfileService) {}

  getFormControl(name: string): FormControl {
    return this.profileService.getForm().get(name) as FormControl;
  }
}
