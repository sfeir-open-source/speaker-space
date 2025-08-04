import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionDurationFieldComponent } from './session-duration-field.component';

describe('SessionDurationFieldComponent', () => {
  let component: SessionDurationFieldComponent;
  let fixture: ComponentFixture<SessionDurationFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionDurationFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDurationFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
