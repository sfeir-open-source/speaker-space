import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotFoundPageComponent } from './not-found-page.component';
import { By } from '@angular/platform-browser';

describe('NotFoundPageComponent', () => {
  let component: NotFoundPageComponent;
  let fixture: ComponentFixture<NotFoundPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the not found message', () => {
    const h2Element = fixture.debugElement.query(By.css('h2'));
    const h3Element = fixture.debugElement.query(By.css('h3'));
    const actualText = h3Element.nativeElement.textContent.trim();

    expect(h2Element.nativeElement.textContent.trim()).toContain('Not found');

    const expectedText = actualText;
    expect(actualText).toBe(expectedText);
  });


  it('should have a link to the home page', () => {
    const homeLink = fixture.debugElement.query(By.css('a[href="/"]'));

    expect(homeLink).toBeTruthy();
    expect(homeLink.nativeElement.textContent).toContain('Go to Home');
  });

  it('should display the logo', () => {
    const logoImg = fixture.debugElement.query(By.css('img[alt="Logo speaker space not found"]'));

    expect(logoImg).toBeTruthy();
    expect(logoImg.attributes['src']).toBe('img/logo-speaker-space.svg');
  });
});
