import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseImportComponent } from './base-import.component';

describe('BaseImportComponent', () => {
  let component: BaseImportComponent;
  let fixture: ComponentFixture<BaseImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaseImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
