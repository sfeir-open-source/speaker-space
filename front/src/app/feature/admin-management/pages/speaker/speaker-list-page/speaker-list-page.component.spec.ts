import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerListPageComponent } from './speaker-list-page.component';

describe('SessionPageComponent', () => {
  let component: SpeakerListPageComponent;
  let fixture: ComponentFixture<SpeakerListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerListPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeakerListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
