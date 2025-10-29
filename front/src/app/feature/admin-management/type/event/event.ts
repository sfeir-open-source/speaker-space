export type Event = {
  teamUrl?: string;
  idEvent?: string;
  eventName: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  online?: boolean;
  url?: string;
  location?: string;
  privateEvent?: boolean;
  webLinkUrl?: string;
  finished?: boolean;
  userCreateId?: string;
  conferenceHallUrl?: string;
  teamId?: string;
  timeZone?: string;
  logoBase64?: string;
  type?: string;
  userRole?: 'admin' | 'speaker';
}
