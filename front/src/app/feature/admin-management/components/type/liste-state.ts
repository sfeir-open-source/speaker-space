import {EventDTO} from '../../type/event/eventDTO';

export type ListState = {
  eventId: string;
  eventUrl: string;
  eventName: string;
  teamId: string;
  teamUrl: string;
  event: EventDTO | null;
  isLoading: boolean;
  error: string | null;
  isLoadingItems: boolean;
  searchTerm: string;
  selectedItems: string[];
  selectAll: boolean;
  currentUserRole: string;
}
