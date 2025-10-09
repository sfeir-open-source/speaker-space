import { Injectable } from '@angular/core';
import {SpeakerCreateRequest} from '../../type/speaker/speaker-create';

export interface SpeakerFormValue {
  name: string;
  email: string;
  bio?: string;
  company?: string;
  location?: string;
  picture?: string;
  references?: string;
}

@Injectable()
export class SpeakerRequestBuilderService {

  buildCreateRequest(
    formValue: SpeakerFormValue,
    eventId: string,
    socialLinks: string[]
  ): SpeakerCreateRequest {
    return {
      name: formValue.name.trim(),
      email: formValue.email.trim().toLowerCase(),
      bio: this.trimOrUndefined(formValue.bio),
      company: this.trimOrUndefined(formValue.company),
      location: this.trimOrUndefined(formValue.location),
      picture: this.trimOrUndefined(formValue.picture),
      references: this.trimOrUndefined(formValue.references),
      eventId,
      socialLinks: socialLinks.length > 0 ? [...socialLinks] : undefined
    };
  }

  private trimOrUndefined(value: string | null | undefined): string | undefined {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  }
}
