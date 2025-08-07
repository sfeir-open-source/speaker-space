import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {InputComponent} from '../../../../../../shared/input/input.component';
import {SocialLinksFieldComponent} from '../social-links-field/social-links-field.component';
import {ImageUploadConfig, ImageUploadResult} from '../../../../../../shared/image-upload/image-upload.type';
import {ImageUploadComponent} from '../../../../../../shared/image-upload/image-upload/image-upload.component';

@Component({
  selector: 'app-speaker-form-fields',
  imports: [
    InputComponent,
    InputComponent,
    SocialLinksFieldComponent,
    ImageUploadComponent
  ],
  templateUrl: './speaker-form-fields.component.html',
  styleUrl: './speaker-form-fields.component.scss'
})

export class SpeakerFormFieldsComponent {
  @Input() form!: FormGroup;
  @Input() socialLinks: string[] = [];
  @Output() socialLinksChange = new EventEmitter<string[]>();

  speakerPhotoConfig: ImageUploadConfig = {
    title: 'Speaker photo',
    description: 'Upload a professional photo of the speaker.',
    acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    maxFileSize: 300 * 1024,
    recommendedSize: '500x500',
    maxSizeText: '300kB max',
    optimizationLink: 'https://squoosh.app',
    width: 'w-32',
    height: 'h-32',
    shape: 'square'
  };

  onSocialLinksChange(links: string[]): void {
    this.socialLinksChange.emit(links);
  }

  onSpeakerPhotoSelected(result: ImageUploadResult): void {
    this.form.get('picture')?.setValue(result.base64);
  }

  onSpeakerPhotoRemoved(): void {
    this.form.get('picture')?.setValue('');
  }
}
