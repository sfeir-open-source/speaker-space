import { Injectable } from '@angular/core';
import {SpeakerProfile} from '../../../../core/models/user.model';
import {Speaker} from '../../type/session/session';

@Injectable({
  providedIn: 'root'
})
export class SpeakerMapperService {

  mapSpeakerProfileToSpeaker(speakerProfile: SpeakerProfile): Speaker {
    return {
      id: speakerProfile.id,
      name: speakerProfile.name,
      email: speakerProfile.email,
      bio: speakerProfile.bio,
      company: speakerProfile.company,
      location: speakerProfile.location,
      picture: speakerProfile.picture,
      socialLinks: speakerProfile.socialLinks || [],
      references: speakerProfile.references
    };
  }
}
