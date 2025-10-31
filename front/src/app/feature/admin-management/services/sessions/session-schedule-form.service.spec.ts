import { TestBed } from '@angular/core/testing';

import { SessionScheduleFormService } from './session-schedule-form.service';

describe('SessionScheduleFormService', () => {
  let service: SessionScheduleFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionScheduleFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
