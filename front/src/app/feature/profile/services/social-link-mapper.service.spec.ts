import { TestBed } from '@angular/core/testing';

import { SocialLinkMapperService } from './social-link-mapper.service';

describe('SocialLinkMapperService', () => {
  let service: SocialLinkMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocialLinkMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
