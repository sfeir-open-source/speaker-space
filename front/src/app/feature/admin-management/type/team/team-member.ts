export type TeamMember = {
  teamId?: string;
  teamName?: string;
  invitedBy?: string;
  invitedAt?: Date;
  userId: string;
  role: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  status?: 'active' | 'invited';
  isCreator?: boolean;
}
