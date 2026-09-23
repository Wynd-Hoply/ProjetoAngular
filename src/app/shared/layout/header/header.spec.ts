import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { Header } from './header';
import { ThemeService } from '../../../core/services/theme';
import { AuthService } from '../../../core/services/auth';
import { ViacepService } from '../../../core/services/API/viacep.service';
import { MatDialog } from '@angular/material/dialog';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  const mockDialog = { open: vi.fn() } as unknown as MatDialog;
  const mockAuth = {
    logout: vi.fn(),
    isAdmin: () => false,
    isAuthenticated: () => false,
    currentUser: () => null,
  } as unknown as AuthService;
  const mockTheme = {
    isDarkMode: () => false,
    toggleTheme: vi.fn(),
  } as unknown as ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: MatDialog, useValue: mockDialog },
        { provide: AuthService, useValue: mockAuth },
        { provide: ThemeService, useValue: mockTheme },
        { provide: ViacepService, useValue: { buscarCep: () => of() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve alternar o menu de peças', () => {
    expect(component.piecesMenuOpen()).toBe(false);
    component.togglePiecesMenu();
    expect(component.piecesMenuOpen()).toBe(true);
    component.togglePiecesMenu();
    expect(component.piecesMenuOpen()).toBe(false);
  });

  it('deve setar erro para CEP inválido', () => {
    component.cep.set('123');
    component.consultarCep();
    expect(component.cepError()).toBe('Digite um CEP válido.');
  });

  it('deve preencher endereco quando viacep retornar resultado', () => {
    const viacep = TestBed.inject(ViacepService) as unknown as ViacepService & { buscarCep: any };
    viacep.buscarCep = () => of({ logradouro: 'Rua A', localidade: 'Cidade' });
    component.cep.set('12345-678');
    component.consultarCep();
    expect(component.cepError()).toBe('');
    expect(component.endereco()).toEqual({ logradouro: 'Rua A', localidade: 'Cidade' });
  });

  it('deve setar erro quando viacep retornar erro', () => {
    const viacep = TestBed.inject(ViacepService) as unknown as ViacepService & { buscarCep: any };
    viacep.buscarCep = () => of({ erro: true });
    component.cep.set('12345678');
    component.consultarCep();
    expect(component.cepError()).toBe('CEP não encontrado.');
  });

  it('logout chama authService, navega e fecha menu mobile', () => {
    const router = TestBed.inject(Router);
    router.navigate = vi.fn(() => Promise.resolve(true));
    component.mobileMenuOpen.set(true);
    component.logout();
    expect(mockAuth.logout).toHaveBeenCalled();
    expect(component.mobileMenuOpen()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('initials retorna primeira letra maiúscula ou ?', () => {
    expect(component.initials('joão')).toBe('J');
    expect(component.initials('')).toBe('?');
  });

  it('openLogin abre dialog', () => {
    // ensure the component uses our mock dialog instead of the real MatDialog
    (component as any).dialog = mockDialog;
    component.openLogin();
    expect((mockDialog.open as any)).toHaveBeenCalled();
  });

  it('onDocumentClick fecha menus ao clicar fora', () => {
    component.piecesMenuOpen.set(true);
    component.mobileMenuOpen.set(true);
    const outside = document.createElement('div');
    component.onDocumentClick({ target: outside } as unknown as MouseEvent);
    expect(component.piecesMenuOpen()).toBe(false);
    expect(component.mobileMenuOpen()).toBe(false);
  });
});
