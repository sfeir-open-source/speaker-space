import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionReviewImportComponent } from './session-review-import.component';

describe('SessionImportComponent', () => {
  let component: SessionReviewImportComponent;
  let fixture: ComponentFixture<SessionReviewImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionReviewImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionReviewImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
