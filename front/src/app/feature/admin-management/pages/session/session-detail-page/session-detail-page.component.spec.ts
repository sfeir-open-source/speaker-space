import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionDetailPageComponent } from './session-detail-page.component';

describe('SessionDetailPageComponent', () => {
  let component: SessionDetailPageComponent;
  let fixture: ComponentFixture<SessionDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionDetailPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
