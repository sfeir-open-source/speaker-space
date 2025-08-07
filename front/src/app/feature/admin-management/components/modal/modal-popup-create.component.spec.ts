import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPopupCreateComponent } from './modal-popup-create.component';

describe('ModalComponent', () => {
  let component: ModalPopupCreateComponent;
  let fixture: ComponentFixture<ModalPopupCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPopupCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPopupCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
