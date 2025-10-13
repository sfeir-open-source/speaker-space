import {Category, Format, Speaker} from './session';

export type SessionCreateRequest = {
  title: string;
  abstractText?: string;
  references?: string;
  level?: string;
  track?: string;
  languages?: string[];
  formats?: Format[];
  categories?: Category[];
  speakers?: Speaker[];
  eventId: string;
  deliberationStatus?: string;
  confirmationStatus?: string;
  start?: Date | null;
  end?: Date | null;
}
