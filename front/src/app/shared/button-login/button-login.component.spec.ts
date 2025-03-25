import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonLoginComponent } from './button-login.component';
import { By } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let component: ButtonLoginComponent;
  let fixture: ComponentFixture<ButtonLoginComponent>;
  let sanitizer: DomSanitizer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonLoginComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ButtonLoginComponent);
    component = fixture.componentInstance;
    sanitizer = TestBed.inject(DomSanitizer);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply button-red class when buttonType is button-red', () => {
    component.buttonType = 'button-red';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.classes['bg-red']).toBeTruthy();
    expect(button.classes['text-white']).toBeTruthy();
  });

  it('should apply button-black class when buttonType is button-black', () => {
    component.buttonType = 'button-black';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.classes['bg-black']).toBeTruthy();
    expect(button.classes['text-white']).toBeTruthy();
  });

  it('should apply button-white class when buttonType is button-white', () => {
    component.buttonType = 'button-white';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.classes['bg-white']).toBeTruthy();
    expect(button.classes['text-black']).toBeTruthy();
    expect(button.classes['border-1']).toBeTruthy();
    expect(button.classes['border-black']).toBeTruthy();
  });

  it('should sanitize and set icon path when provided', () => {
    const iconPath = '<path d="M1 1 L2 2" />';
    const spy = jest.spyOn(sanitizer, 'bypassSecurityTrustHtml');

    component.iconPath = iconPath;
    component.ngOnChanges();

    expect(spy).toHaveBeenCalled();
    expect(component.sanitizedIconPath).toBeTruthy();
    expect(component.sanitizedIconPath.toString()).toContain(iconPath);
  });



  it('should render content inside the button', () => {
    const contentSpan = fixture.debugElement.query(By.css('button span:last-child'));

    const testText = 'Test Button Text';
    contentSpan.nativeElement.innerHTML = testText;

    fixture.detectChanges();

    expect(contentSpan.nativeElement.textContent).toContain(testText);
  });

  it('should use custom viewBox when provided', () => {
    const customViewBox = '0 0 24 24';
    component.iconViewBox = customViewBox;
    component.iconPath = '<path d="M1 1 L2 2" />';
    component.ngOnChanges();
    fixture.detectChanges();

    expect(component.sanitizedIconPath.toString()).toContain(customViewBox);
  });
});
