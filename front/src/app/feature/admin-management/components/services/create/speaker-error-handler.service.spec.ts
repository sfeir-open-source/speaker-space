import { TestBed } from '@angular/core/testing';

import { SpeakerErrorHandlerService } from './speaker-error-handler.service';

describe('SpeakerErrorHandlerService', () => {
  let service: SpeakerErrorHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeakerErrorHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
