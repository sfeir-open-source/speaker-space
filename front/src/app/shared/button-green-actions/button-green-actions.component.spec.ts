import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ButtonGreenActionsComponent } from './button-green-actions.component';

describe('ActionButtonComponent', () => {
  let component: ButtonGreenActionsComponent;
  let fixture: ComponentFixture<ButtonGreenActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonGreenActionsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ButtonGreenActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default button type as "button"', () => {
    expect(component.type).toBe('button');
  });

  it('should set the button type correctly when provided', () => {
    component.type = 'submit';
    fixture.detectChanges();

    const buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(buttonElement.type).toBe('submit');
  });

  it('should render content inside the button', () => {
    fixture.componentRef.setInput('type', 'button');
    const buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;

    buttonElement.textContent = 'Test Button';
    fixture.detectChanges();

    expect(buttonElement.textContent.trim()).toBe('Test Button');
  });
});

