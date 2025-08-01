import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionDetailUnifiedComponent } from './session-detail-unified.component';

describe('SessionDetailUnifiedComponent', () => {
  let component: SessionDetailUnifiedComponent;
  let fixture: ComponentFixture<SessionDetailUnifiedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionDetailUnifiedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDetailUnifiedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
