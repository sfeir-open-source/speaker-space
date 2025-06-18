import { TestBed } from '@angular/core/testing';

import { SocialLinkService } from './social-link.service';

describe('SocialLinkService', () => {
  let service: SocialLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocialLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
