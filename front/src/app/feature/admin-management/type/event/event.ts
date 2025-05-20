export type Event = {
  idEvent?: string;
  eventName: string;
  description?: string;
  startDate?: string;
  url?: string;
  endDate?: string;
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

export type EventDTO = {
  eventName: string;
  url: string;
  conferenceHallUrl?: string;
  timeZone?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  description?: string;
  isOnline?: boolean;
  teamId?: string;
  idEvent?: string;
}
