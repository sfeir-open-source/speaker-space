import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericFilterPopupComponent } from './generic-filter-popup.component';

describe('GenericFilterPopupComponent', () => {
  let component: GenericFilterPopupComponent;
  let fixture: ComponentFixture<GenericFilterPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericFilterPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericFilterPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
