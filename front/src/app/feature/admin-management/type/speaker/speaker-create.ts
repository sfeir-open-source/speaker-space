export type SpeakerCreateRequest = {
  name: string;
  bio?: string;
  company?: string;
  references?: string;
  email: string;
  eventId: string;
  picture?: string;
  location?: string;
  socialLinks?: string[];
}

export type SpeakerImportData = {
  name: string;
  bio?: string;
  company?: string;
  references?: string;
  email?: string;
  eventId: string;
  picture?: string;
  location?: string;
  socialLinks?: string[];
  createdAt?: string;
  updatedAt?: string;
}
