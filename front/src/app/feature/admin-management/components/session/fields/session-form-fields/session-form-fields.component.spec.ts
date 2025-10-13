import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionFormFieldsComponent } from './session-form-fields.component';

describe('SessionFormFieldsComponent', () => {
  let component: SessionFormFieldsComponent;
  let fixture: ComponentFixture<SessionFormFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionFormFieldsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionFormFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
