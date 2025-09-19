import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveEventPopupComponent } from './archive-event-popup.component';

describe('ArchiveEventPopupComponent', () => {
  let component: ArchiveEventPopupComponent;
  let fixture: ComponentFixture<ArchiveEventPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveEventPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchiveEventPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
