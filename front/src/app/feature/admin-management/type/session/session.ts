export type SessionImportData = {
  id?: string;
  title: string;
  abstractText: string;
  deliberationStatus: string;
  confirmationStatus: string;
  level: string;
  references?: string;
  formats: Format[];
  categories: Category[];
  tags: string[];
  languages: string[];
  speakers: Speaker[];
  reviews: Reviews | null;
  eventId?: string;
  createdAt?: string;
  updatedAt?: string;
  start?: Date;
  end?: Date;
  track?: string;
}

export type SessionImportRequest = {
  eventId: string;
  sessions: SessionImportData[];
}

export type ImportResult = {
  successCount: number;
  totalCount: number;
  errors: string[];
}

export type Format = {
  id: string;
  name: string;
  description: string;
}

export type Category = {
  id: string;
  name: string;
  description: string;
}

export type Speaker = {
  id: string;
  name: string;
  bio: string;
  company: string;
  references: string;
  picture: string;
  location: string;
  email: string;
  socialLinks: string[];
}

export type Reviews = {
  average: number;
  positives: number;
  negatives: number;
}
