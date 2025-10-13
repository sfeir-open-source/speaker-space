import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionSpeakersFieldComponent } from './session-speakers-field.component';

describe('SessionSpeakersFieldComponent', () => {
  let component: SessionSpeakersFieldComponent;
  let fixture: ComponentFixture<SessionSpeakersFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionSpeakersFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionSpeakersFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
