import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthErrorDialogComponent } from './auth-error-dialog.component';

describe('AuthErrorDialogComponent', () => {
  let component: AuthErrorDialogComponent;
  let fixture: ComponentFixture<AuthErrorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthErrorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthErrorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
