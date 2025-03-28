export interface ProfileData {
  fullName: string;
  emailAddress: string;
  company: string;
  city: string;
  avatarPictureURL: string;
  phoneNumber: string;
  biographySpeaker: string;
  socialLinks: {
    github: string;
    x: string;
    bluesky: string;
    linkedin: string;
  };
  otherLinks: string[];
}
