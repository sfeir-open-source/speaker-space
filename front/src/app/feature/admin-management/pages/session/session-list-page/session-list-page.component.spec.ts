import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionListPageComponent } from './session-list-page.component';

describe('SessionPageComponent', () => {
  let component: SessionListPageComponent;
  let fixture: ComponentFixture<SessionListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionListPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
