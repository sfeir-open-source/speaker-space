import { TestBed } from '@angular/core/testing';

import { TeamMemberSearchService } from './team-member-search.service';

describe('TeamMemberSearchService', () => {
  let service: TeamMemberSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeamMemberSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
