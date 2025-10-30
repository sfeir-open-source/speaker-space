export type User = {
  token?: string;
  uid: string;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
  company?: string | null;
  location?: string | null;
  phoneNumber?: string | null;
  socialLinks?: string[];
  bio?: string | null;
  speakerIds?: string[];
  eventIds?: string[];
  sessionIds?: string[];
}

export type SocialLinkField = {
  index: number;
  label?: string;
  placeholder?: string;
  iconPath?: string;
  icon?: string;
}
