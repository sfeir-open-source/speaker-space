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
  isFinished: boolean;
  statusText: 'Open' | 'Closed';
  statusClass: string;
  daysRemaining?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventStatusService {

  getEventStatus(event: Event): EventStatus {
    if (event.isFinish === true) {
      return {
        isFinished: true,
        statusText: 'Closed',
        statusClass: 'bg-orange-500'
      };
    }

    if (!event.endDate) {
      return {
        isFinished: false,
        statusText: 'Open',
        statusClass: 'bg-green-500'
      };
    }

    const endDate = this.parseEventDate(event.endDate);
    if (!endDate) {
      return {
        isFinished: false,
        statusText: 'Open',
        statusClass: 'bg-green-500'
      };
    }

    const today = startOfDay(new Date());
    const eventEndDay = startOfDay(endDate);

    const isFinished = isBefore(eventEndDay, today);

    let daysRemaining: number | undefined;
    if (!isFinished) {
      daysRemaining = differenceInDays(eventEndDay, today) + 1;
    }

    return {
      isFinished,
      statusText: isFinished ? 'Closed' : 'Open',
      statusClass: isFinished ? 'bg-orange-500' : 'bg-green-500',
      daysRemaining
    };
  }

  filterEventsByStatus(events: Event[], showArchived: boolean): Event[] {
    return events.filter(event => {
      const status = this.getEventStatus(event);
      return showArchived ? status.isFinished : !status.isFinished;
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
