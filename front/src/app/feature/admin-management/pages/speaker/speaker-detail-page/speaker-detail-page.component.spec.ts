import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerDetailPageComponent } from './speaker-detail-page.component';

describe('SessionDetailPageComponent', () => {
  let component: SpeakerDetailPageComponent;
  let fixture: ComponentFixture<SpeakerDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerDetailPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeakerDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
