import {Category, Format, Speaker} from '../session/session';

export type CalendarSessionData = {
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

export type CalendarDayData = {
  date: Date;
  tracks: TrackColumn[];
}

export type TrackColumn = {
  name: string;
  sessions: CalendarSession[];
}

export type CalendarSession = {
  session: CalendarSessionData;
  startTime: Date;
  endTime: Date;
  duration: number;
  track: string;
  topPosition: number;
  height: number;
}
