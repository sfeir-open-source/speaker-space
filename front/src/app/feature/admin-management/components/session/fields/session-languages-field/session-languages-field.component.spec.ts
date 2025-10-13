import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionLanguagesFieldComponent } from './session-languages-field.component';

describe('SessionLanguagesFieldComponent', () => {
  let component: SessionLanguagesFieldComponent;
  let fixture: ComponentFixture<SessionLanguagesFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionLanguagesFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionLanguagesFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
