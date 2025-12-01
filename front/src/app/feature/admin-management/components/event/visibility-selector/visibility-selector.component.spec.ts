import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisibilitySelectorComponent } from './visibility-selector.component';

describe('VisibilitySelectorComponent', () => {
  let component: VisibilitySelectorComponent;
  let fixture: ComponentFixture<VisibilitySelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisibilitySelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisibilitySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
