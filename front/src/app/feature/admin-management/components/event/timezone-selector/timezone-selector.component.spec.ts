import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimezoneSelectorComponent } from './timezone-selector.component';

describe('TimezoneSelectorComponent', () => {
  let component: TimezoneSelectorComponent;
  let fixture: ComponentFixture<TimezoneSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimezoneSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimezoneSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
