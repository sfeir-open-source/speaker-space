import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionDatetimeFieldsComponent } from './session-datetime-fields.component';

describe('SessionDatetimeFieldsComponent', () => {
  let component: SessionDatetimeFieldsComponent;
  let fixture: ComponentFixture<SessionDatetimeFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionDatetimeFieldsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDatetimeFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
