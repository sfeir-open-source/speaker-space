import {Category, Format, Speaker} from '../session/session';

export interface CalendarSessionData {
  id: string;
  title: string;
  abstractText?: string;
  start: Date;
  end: Date;
  track?: string;
  speakers: Speaker[];
  level?: string;
  formats?: Format[];
  categories?: Category[];
}

export interface CalendarDayData {
  date: Date;
  tracks: TrackColumn[];
}

export interface TrackColumn {
  name: string;
  sessions: CalendarSession[];
}

export interface CalendarSession {
  session: CalendarSessionData;
  startTime: Date;
  endTime: Date;
  duration: number;
  track: string;
  topPosition: number;
  height: number;
}
