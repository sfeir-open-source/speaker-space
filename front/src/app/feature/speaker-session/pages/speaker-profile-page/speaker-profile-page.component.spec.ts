import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerProfilePageComponent } from './speaker-profile-page.component';

describe('SpeakerProfilePageComponent', () => {
  let component: SpeakerProfilePageComponent;
  let fixture: ComponentFixture<SpeakerProfilePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerProfilePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeakerProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
