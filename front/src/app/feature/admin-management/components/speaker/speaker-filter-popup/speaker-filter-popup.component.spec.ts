import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerFilterPopupComponent } from './speaker-filter-popup.component';

describe('SpeakerUnifiedFilterPopupComponent', () => {
  let component: SpeakerFilterPopupComponent;
  let fixture: ComponentFixture<SpeakerFilterPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerFilterPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeakerFilterPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
