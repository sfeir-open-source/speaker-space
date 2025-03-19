import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthErrorDialogComponent } from './auth-error-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AuthErrorDialogComponent', () => {
  let component: AuthErrorDialogComponent;
  let fixture: ComponentFixture<AuthErrorDialogComponent>;
  const mockDialogRef = {
    close: jest.fn()
  };
  const mockData = {
    message: 'Test error message',
    title: 'Test Title',
    email: 'test@example.com'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AuthErrorDialogComponent,
        MatDialogModule,
        MatButtonModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AuthErrorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the error message', () => {
    const messageElement = fixture.debugElement.query(By.css('p'));
    expect(messageElement.nativeElement.textContent).toBe('Test error message');
  });

  it('should have a close button', () => {
    const closeButton = fixture.debugElement.query(By.css('button[mat-dialog-close]'));
    expect(closeButton).toBeTruthy();
    expect(closeButton.nativeElement.textContent.trim()).toBe('Close');
  });

  it('should close the dialog when the close button is clicked', () => {
    const closeButton = fixture.debugElement.query(By.css('button[mat-dialog-close]'));
    closeButton.nativeElement.click();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
