import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionCreatePopupComponent } from './session-create-popup.component';

describe('SessionCreatePageComponent', () => {
  let component: SessionCreatePopupComponent;
  let fixture: ComponentFixture<SessionCreatePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionCreatePopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionCreatePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
