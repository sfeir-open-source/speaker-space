import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonGreyComponent } from './button-grey.component';

describe('ButtonGreyComponent', () => {
  let component: ButtonGreyComponent;
  let fixture: ComponentFixture<ButtonGreyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonGreyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonGreyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
