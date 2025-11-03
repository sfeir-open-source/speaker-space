export type TeamMember = {
  teamId?: string;
  teamName?: string;
  invitedBy?: string;
  invitedAt?: Date;
  userId: string;
  role: string;
  email: string;
  name?: string | null;
  photoURL?: string | null;
  status?: 'active' | 'invited';
  isCreator?: boolean;
}
