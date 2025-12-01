import { TestBed } from '@angular/core/testing';

import { EventDangerActionsService } from './event-danger-actions.service';

describe('EventDangerActionsService', () => {
  let service: EventDangerActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventDangerActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
