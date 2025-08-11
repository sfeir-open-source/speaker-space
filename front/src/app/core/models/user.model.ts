import {SessionImportData} from '../../feature/admin-management/type/session/session';

export type User = {
  token?: string;
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  company?: string | null;
  city?: string | null;
  phoneNumber?: string | null;
  githubLink?: string | null;
  twitterLink?: string | null;
  blueSkyLink?: string | null;
  linkedInLink?: string | null;
  otherLink?: string | null;
  biography?: string | null;
  speakerIds?: string[];
  eventIds?: string[];
  sessionIds?: string[];
}

export interface UserSpeakerProfile {
  readonly user: User;
  readonly speakers: readonly SpeakerProfile[];
  readonly sessions: readonly SessionImportData[];
  readonly eventId: string;
}

export interface SpeakerProfile {
  readonly id: string;
  readonly conferenceHallId?: string;
  readonly name: string;
  readonly email?: string;
  readonly bio?: string;
  readonly company?: string;
  readonly location?: string;
  readonly picture?: string;
  readonly socialLinks: readonly string[];
}
