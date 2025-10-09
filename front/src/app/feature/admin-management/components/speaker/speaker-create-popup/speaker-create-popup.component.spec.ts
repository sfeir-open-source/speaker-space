import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerCreatePopupComponent } from './speaker-create-popup.component';

describe('SpeakerCreatePopupComponent', () => {
  let component: SpeakerCreatePopupComponent;
  let fixture: ComponentFixture<SpeakerCreatePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerCreatePopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeakerCreatePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
