import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionScheduleFormComponent } from './session-schedule-form.component';

describe('SessionScheduleFormComponent', () => {
  let component: SessionScheduleFormComponent;
  let fixture: ComponentFixture<SessionScheduleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionScheduleFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionScheduleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
