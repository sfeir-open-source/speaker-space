import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSettingsSectionsComponent } from './event-settings-sections.component';

describe('EventSettingsSectionsComponent', () => {
  let component: EventSettingsSectionsComponent;
  let fixture: ComponentFixture<EventSettingsSectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSettingsSectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventSettingsSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
