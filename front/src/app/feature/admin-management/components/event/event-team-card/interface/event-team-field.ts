export type EventTeamField = {
  idEvent: string;
  title: string;
  type: string;
  img: string;
  link: string;
  statusText: 'Open' | 'Closed';
  logoBase64?: string | null;
  statusClass?: string | null;
  publicUrl?: string | null;
  daysRemaining?: number;
  isFinished?: boolean;
  userRole?: 'admin' | 'speaker';
}
