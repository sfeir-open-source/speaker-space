import { TestBed } from '@angular/core/testing';

import { FormModalService } from './form-modal.service';

describe('FormModalService', () => {
  let service: FormModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
