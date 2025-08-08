import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {InputComponent} from '../../../../../../shared/input/input.component';
import {SocialLinksFieldComponent} from '../social-links-field/social-links-field.component';

@Component({
  selector: 'app-speaker-form-fields',
  imports: [
    InputComponent,
    InputComponent,
    SocialLinksFieldComponent,
  ],
  templateUrl: './speaker-form-fields.component.html',
  styleUrl: './speaker-form-fields.component.scss'
})

export class SpeakerFormFieldsComponent {
  @Input() form!: FormGroup;
  @Input() socialLinks: string[] = [];
  @Output() socialLinksChange = new EventEmitter<string[]>();


  onSocialLinksChange(links: string[]): void {
    this.socialLinksChange.emit(links);
  }
}
