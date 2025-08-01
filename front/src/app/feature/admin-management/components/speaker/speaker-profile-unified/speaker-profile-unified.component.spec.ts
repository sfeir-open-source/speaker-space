import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerProfileUnifiedComponent } from './speaker-profile-unified.component';

describe('SpeakerProfileUnifiedComponent', () => {
  let component: SpeakerProfileUnifiedComponent;
  let fixture: ComponentFixture<SpeakerProfileUnifiedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerProfileUnifiedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeakerProfileUnifiedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
