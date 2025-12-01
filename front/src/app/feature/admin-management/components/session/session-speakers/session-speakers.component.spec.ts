import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionSpeakersComponent } from './session-speakers.component';

describe('SessionSpeakersComponent', () => {
  let component: SessionSpeakersComponent;
  let fixture: ComponentFixture<SessionSpeakersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionSpeakersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionSpeakersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
