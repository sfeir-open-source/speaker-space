import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionScheduleImportComponent } from './session-schedule-import.component';

describe('SessionImportComponent', () => {
  let component: SessionScheduleImportComponent;
  let fixture: ComponentFixture<SessionScheduleImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionScheduleImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionScheduleImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
