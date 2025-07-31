import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerSessionListPageComponent } from './speaker-session-list-page.component';

describe('EventSessionsUnifiedComponent', () => {
  let component: SpeakerSessionListPageComponent;
  let fixture: ComponentFixture<SpeakerSessionListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerSessionListPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeakerSessionListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
