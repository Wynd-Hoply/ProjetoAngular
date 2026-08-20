import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle the pieces menu and close it from outside clicks', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const trigger = compiled.querySelector('.pieces-menu__trigger') as HTMLButtonElement;

    expect(compiled.querySelector('.pieces-menu__panel')).toBeNull();

    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('.pieces-menu__panel')).toBeTruthy();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('.pieces-menu__panel')).toBeNull();
  });
});
