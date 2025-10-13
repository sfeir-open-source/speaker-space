import { TestBed } from '@angular/core/testing';

import { EventFormFieldsService } from './event-form-fields.service';

describe('EventFormFieldsService', () => {
  let service: EventFormFieldsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventFormFieldsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
