export type DangerZoneAction = {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  buttonIcon: string;
  action: () => void;
}

export type DangerZoneConfig = {
  title: string;
  entityName: string;
  entityType: 'team' | 'event';
  showArchiveSection?: boolean;
  isDeleting?: boolean;
  currentUserRole?: string;
}
