import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventTeamCardComponent } from './event-team-card.component';

describe('EventTeamComponent', () => {
  let component: EventTeamCardComponent;
  let fixture: ComponentFixture<EventTeamCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTeamCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventTeamCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
