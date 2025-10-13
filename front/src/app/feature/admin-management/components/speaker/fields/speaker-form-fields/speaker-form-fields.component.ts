import {Component, EventEmitter, input, Input, output, Output} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {SocialLinksFieldComponent} from '../social-links-field/social-links-field.component';
import {FieldComponent} from '../../../../../../shared/input/field.component';

@Component({
  selector: 'app-speaker-form-fields',
  imports: [
    SocialLinksFieldComponent,
    FieldComponent,
  ],
  templateUrl: './speaker-form-fields.component.html',
  standalone: true,
  styleUrl: './speaker-form-fields.component.scss'
})

export class SpeakerFormFieldsComponent {
  form = input.required<FormGroup>();
  socialLinks = input<string[]>([]);

  socialLinksChange = output<string[]>();

  onSocialLinksChange(links: string[]): void {
    this.socialLinksChange.emit(links);
  }
}
