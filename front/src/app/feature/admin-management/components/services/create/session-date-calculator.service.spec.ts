import { TestBed } from '@angular/core/testing';

import { SessionDateCalculatorService } from './session-date-calculator.service';

describe('SessionDateCalculatorService', () => {
  let service: SessionDateCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionDateCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
