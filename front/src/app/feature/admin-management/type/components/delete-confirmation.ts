export type DeleteConfirmationConfig = {
  entityType: 'team' | 'event';
  entityName: string;
  title?: string;
  description?: string;
  confirmButtonText?: string;
  loadingText?: string;
  requireTextConfirmation?: boolean;
  confirmationText?: string;
}
