import { TestBed } from '@angular/core/testing';

import { EmailLinkService } from './email-link.service';

describe('EmailLinkService', () => {
  let service: EmailLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
