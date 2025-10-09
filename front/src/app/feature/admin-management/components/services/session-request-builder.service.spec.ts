import { TestBed } from '@angular/core/testing';

import { SessionRequestBuilderService } from './session-request-builder.service';

describe('SessionRequestBuilderService', () => {
  let service: SessionRequestBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionRequestBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
