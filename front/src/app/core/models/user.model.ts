export interface User {
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
}
