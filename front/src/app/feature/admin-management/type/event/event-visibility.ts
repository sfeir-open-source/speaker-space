export type UserRole = 'Owner' | 'Admin' | 'Member';

export type EventVisibility = 'private' | 'public';

export type  VisibilityOption = {
  value: 'private' | 'public';
  label: string;
  description: string;
}
