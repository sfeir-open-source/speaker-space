import {Speaker} from './session';

export interface ScheduleJsonData {
  name: string;
  days: string[];
  timeZone: string;
  sessions: ScheduleSessionData[];
}

export interface ScheduleSessionData {
  id: string;
  start: string;
  end: string;
  track: string;
  title: string;
  language: string;
  proposal?: {
    id: string;
    abstract: string;
    level: string;
    formats: string[];
    categories: string[];
    speakers: Speaker[];
  };
}
