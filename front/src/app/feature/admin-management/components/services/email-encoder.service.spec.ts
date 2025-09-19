import { TestBed } from '@angular/core/testing';

import { EmailEncoderService } from './email-encoder.service';

describe('EmailEncoderService', () => {
  let service: EmailEncoderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailEncoderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
