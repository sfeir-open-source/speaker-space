import { Injectable } from '@angular/core';
import {SpeakerProfile} from '../../../../core/models/user.model';
import {Speaker} from '../../type/session/session';

@Injectable({
  providedIn: 'root'
})
export class SpeakerMapperService {

  mapSpeakerProfileToSpeaker(speakerProfile: SpeakerProfile): Speaker {
    return {
      id: speakerProfile.id || '',
      idConferenceHall: speakerProfile.idConferenceHall  || '',
      name: speakerProfile.name || 'Speaker Name Not Set',
      bio: speakerProfile.bio || '',
      company: speakerProfile.company || '',
      references: speakerProfile.references || '',
      picture: speakerProfile.picture || '',
      location: speakerProfile.location || '',
      email: speakerProfile.email || '',
      socialLinks: speakerProfile.socialLinks || []
    };
  }
}
