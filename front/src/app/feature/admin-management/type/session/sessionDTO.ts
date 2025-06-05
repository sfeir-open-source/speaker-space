import {Category, Format, Reviews} from './session';

export interface SessionDTO {
  id?: string;
  title?: string;
  abstractText?: string;
  speakers?: Speaker[];
  createdAt?: string;
  deliberationStatus?: boolean;
  confirmationStatus?: boolean;
  level?: string;
  eventId?: string;
  formats?: Format[];
  categories?: Category[];
  tags?: string[];
  languages?: string[];
  references?: string;
  reviews?: Reviews;
}

export interface Speaker {
  name?: string;
  bio?: string;
  company?: string;
  references?: string;
  picture?: string;
  location?: string;
  email?: string;
  socialLinks?: string[];
}
