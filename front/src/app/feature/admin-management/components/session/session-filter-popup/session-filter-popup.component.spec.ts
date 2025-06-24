import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionFilterPopupComponent } from './session-filter-popup.component';

describe('FilterPopupComponent', () => {
  let component: SessionFilterPopupComponent;
  let fixture: ComponentFixture<SessionFilterPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionFilterPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionFilterPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
