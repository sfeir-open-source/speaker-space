export type Event = {
  idEvent?: string;
  eventName: string;
  description?: string;
  startDate?: Date | null;
  url?: string;
  endDate?: Date | null;
  isOnline?: boolean;
  location?: string;
  isPrivate?: boolean;
  webLinkUrl?: string;
  isFinish?: boolean;
  userCreateId?: string;
  conferenceHallUrl?: string;
  teamId?: string;
  timeZone?: string;
}
