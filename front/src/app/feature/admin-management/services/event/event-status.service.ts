import { Injectable } from '@angular/core';
import {Event} from '../../type/event/event';

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
    const now = new Date();
    const endDate : Date | null = event.endDate ? new Date(event.endDate) : null;

    if (event.isFinish === true) {
      return {
        isFinished: true,
        statusText: 'Closed',
        statusClass: 'bg-orange-500'
      };
    }

    if (!endDate) {
      return {
        isFinished: false,
        statusText: 'Open',
        statusClass: 'bg-green-500'
      };
    }

    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const isFinished : boolean = endDateOnly < nowDateOnly;

    let daysRemaining: number | undefined;
    if (!isFinished) {
      const timeDiff : number = endDateOnly.getTime() - nowDateOnly.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
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

  getEventCounts(events: Event[]): { active: number; archived: number } {
    const counts = { active: 0, archived: 0 };

    events.forEach(event => {
      const status = this.getEventStatus(event);
      if (status.isFinished) {
        counts.archived++;
      } else {
        counts.active++;
      }
    });

    return counts;
  }
}
