export type EventTeamField = {
  idEvent: string;
  title: string;
  type: string;
  img: string;
  link: string;
  statusText: 'Open' | 'Closed';
  logoBase64?: string | null;
}
