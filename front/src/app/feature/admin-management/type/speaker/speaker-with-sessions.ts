import {Category, Format, SessionImportData, Speaker} from '../session/session';

export type SpeakerWithSessionsDTO = {
  speaker: Speaker;
  sessions: SessionImportData[];
  formats: Format[];
  categories: Category[];
}
