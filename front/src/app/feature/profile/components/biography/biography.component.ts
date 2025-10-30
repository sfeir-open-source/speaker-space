import { Component } from '@angular/core';
import {FormControl} from '@angular/forms';
import {FieldComponent} from '../../../../shared/input/field.component';
import {ProfileService} from '../../services/profile.service';

@Component({
  selector: 'app-biography',
  standalone:true,
  imports: [
    FieldComponent
  ],
  templateUrl: './biography.component.html',
  styleUrl: './biography.component.scss'
})
export class BiographyComponent {

  constructor(private readonly profileService: ProfileService) {}

  getFormControl(name: string): FormControl {
    return this.profileService.getForm().get(name) as FormControl;
  }
}
