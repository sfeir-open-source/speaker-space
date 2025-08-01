import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionListUnifiedComponent } from './session-list-unified.component';

describe('SessionListUnifiedComponent', () => {
  let component: SessionListUnifiedComponent;
  let fixture: ComponentFixture<SessionListUnifiedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionListUnifiedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionListUnifiedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
