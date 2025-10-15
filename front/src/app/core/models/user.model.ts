export type User = {
  token?: string;
  uid: string;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
  company?: string | null;
  location?: string | null;
  phoneNumber?: string | null;
  socialLink: string[];
  bio?: string | null;
  speakerIds?: string[];
  eventIds?: string[];
  sessionIds?: string[];
}
