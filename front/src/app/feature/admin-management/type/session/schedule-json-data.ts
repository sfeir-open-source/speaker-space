export type ScheduleJsonData = {
  name: string;
  days: string[];
  timeZone: string;
  sessions: ScheduleSessionData[];
}

export type ScheduleSessionData = {
  id: string;
  start: Date;
  end: Date;
  track: string;
  title: string;
  languages: string;
  proposal?: {
    id: string;
    abstractText: string;
    level: string;
    formats: string[];
    categories: string[];
    speakers: {
      id: string;
      name: string;
      bio: string;
      company: string;
      picture: string;
      socialLinks: string[];
    }[];
  };
  eventId: string;
}

export type SessionScheduleImportDataDTO = {
  id: string;
  start: Date;
  end: Date;
  track: string;
  title: string;
  languages: string;
  proposal?: {
    id: string;
    abstractText: string;
    level: string;
    formats: string[];
    categories: string[];
    speakers: {
      id: string;
      name: string;
      bio: string;
      company: string;
      picture: string;
      socialLinks: string[];
    }[];
  };
  eventId: string;
}

export type SessionScheduleUpdate = {
  start?: Date;
  end?: Date;
  track?: string;
}
