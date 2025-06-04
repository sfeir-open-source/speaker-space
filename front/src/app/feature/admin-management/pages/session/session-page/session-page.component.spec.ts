import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionPageComponent } from './session-page.component';

describe('SessionPageComponent', () => {
  let component: SessionPageComponent;
  let fixture: ComponentFixture<SessionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
