import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerSessionDetailPageComponent } from './speaker-session-detail-page.component';

describe('SpeakerSessionDetailPageComponent', () => {
  let component: SpeakerSessionDetailPageComponent;
  let fixture: ComponentFixture<SpeakerSessionDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerSessionDetailPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeakerSessionDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
