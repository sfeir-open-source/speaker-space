import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarEventPageComponent } from './calendar-event-page.component';

describe('CalendarEventPageComponent', () => {
  let component: CalendarEventPageComponent;
  let fixture: ComponentFixture<CalendarEventPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarEventPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarEventPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
