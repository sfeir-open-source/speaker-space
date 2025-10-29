import { Injectable } from '@angular/core';
import {
  isBefore,
  startOfDay,
  differenceInDays,
  parseISO,
  isValid
} from 'date-fns';
import { Event } from '../../type/event/event';

export interface EventStatus {
  finished: boolean;
  statusText: 'Open' | 'Closed';
  statusClass: string;
  daysRemaining?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventStatusService {

  getEventStatus(event: Event): EventStatus {
    if (event.finished === true) {
      return {
        finished: true,
        statusText: 'Closed',
        statusClass: 'bg-orange-500'
      };
    }

    if (!event.endDate) {
      return {
        finished: false,
        statusText: 'Open',
        statusClass: 'bg-green-500'
      };
    }

    const endDate = this.parseEventDate(event.endDate);
    if (!endDate) {
      return {
        finished: false,
        statusText: 'Open',
        statusClass: 'bg-green-500'
      };
    }

    const today = startOfDay(new Date());
    const eventEndDay = startOfDay(endDate);

    const finished = isBefore(eventEndDay, today);

    let daysRemaining: number | undefined;
    if (!finished) {
      daysRemaining = differenceInDays(eventEndDay, today) + 1;
    }

    return {
      finished,
      statusText: finished ? 'Closed' : 'Open',
      statusClass: finished ? 'bg-orange-500' : 'bg-green-500',
      daysRemaining
    };
  }

  filterEventsByStatus(events: Event[], showArchived: boolean): Event[] {
    return events.filter(event => {
      const status = this.getEventStatus(event);
      return showArchived ? status.finished : !status.finished;
    });
  }

  private parseEventDate(dateInput: string | Date): Date | null {
    try {
      if (dateInput instanceof Date) {
        return isValid(dateInput) ? dateInput : null;
      }

      if (typeof dateInput === 'string') {
        const parsed = parseISO(dateInput);
        return isValid(parsed) ? parsed : null;
      }

      return null;
    } catch {
      return null;
    }
  }
}
