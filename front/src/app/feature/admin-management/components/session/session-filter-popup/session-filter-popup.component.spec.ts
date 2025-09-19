import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnifiedFilterPopupComponent } from './unified-filter-popup.component';

describe('UnifiedFilterPopupComponent', () => {
  let component: UnifiedFilterPopupComponent;
  let fixture: ComponentFixture<UnifiedFilterPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnifiedFilterPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnifiedFilterPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
