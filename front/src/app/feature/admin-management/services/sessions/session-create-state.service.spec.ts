import { TestBed } from '@angular/core/testing';

import { SessionCreateStateService } from './session-create-state.service';

describe('SessionCreateStateService', () => {
  let service: SessionCreateStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionCreateStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
