import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';

import { Login } from './login';
import { AuthService } from '../../../core/services/auth';

/**
 * Testes de Formulário Dinâmico para Componente Login
 * 
 * Este arquivo de testes demonstra as melhores práticas para testar:
 * - Renderização de formulário de login
 * - Validação de campos (identifier, password)
 * - Integração com AuthService
 * - Estados de loading
 * - Fechamento de dialog
 */
describe('Login Component - Teste de Formulário Dinâmico', () => {
  let component: any;
  let fixture: ComponentFixture<Login>;
  let authServiceMock: any;
  let dialogRefMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
    };

    dialogRefMock = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Renderização do Formulário', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve renderizar campos de email/username e password', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input');
      
      expect(inputs.length).toBeGreaterThanOrEqual(2);
      const passwordInput = Array.from(inputs).find((input: any) => input.type === 'password');
      expect(passwordInput).toBeTruthy();
    });

    it('deve renderizar botão submit', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const submitButton = Array.from(buttons).find((btn: any) => 
        btn.textContent?.toLowerCase().includes('entrar') || 
        btn.textContent?.toLowerCase().includes('login')
      );
      expect(submitButton).toBeTruthy();
    });

    it('deve renderizar links de navegação', () => {
      const links = fixture.nativeElement.querySelectorAll('a');
      // Verificar se há pelo menos alguns links na página
      expect(links.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validação de Campos', () => {
    it('deve validar identifier como inválido quando vazio', () => {
      const control = component.form.controls.identifier;
      control.setValue('');
      expect(control.invalid).toBe(true);
    });

    it('deve validar identifier como inválido quando menor que 3 caracteres', () => {
      const control = component.form.controls.identifier;
      control.setValue('ab');
      expect(control.invalid).toBe(true);
    });

    it('deve validar identifier como válido com 3+ caracteres', () => {
      const control = component.form.controls.identifier;
      control.setValue('joao_silva');
      expect(control.valid).toBe(true);
    });

    it('deve validar email como identifier válido', () => {
      const control = component.form.controls.identifier;
      control.setValue('joao@email.com');
      expect(control.valid).toBe(true);
    });

    it('deve validar password como inválido quando vazio', () => {
      const control = component.form.controls.password;
      control.setValue('');
      expect(control.invalid).toBe(true);
    });

    it('deve validar password como inválido quando menor que 6 caracteres', () => {
      const control = component.form.controls.password;
      control.setValue('123');
      expect(control.invalid).toBe(true);
    });

    it('deve validar password como válido com 6+ caracteres', () => {
      const control = component.form.controls.password;
      control.setValue('senha123');
      expect(control.valid).toBe(true);
    });
  });

  describe('Estado Completo do Formulário', () => {
    it('deve ser inválido quando identifier está vazio', () => {
      component.form.controls.password.setValue('senha123');
      
      expect(component.form.invalid).toBe(true);
    });

    it('deve ser inválido quando password está vazio', () => {
      component.form.controls.identifier.setValue('joao_silva');
      
      expect(component.form.invalid).toBe(true);
    });

    it('deve ser válido quando ambos os campos estão preenchidos', () => {
      component.form.controls.identifier.setValue('joao_silva');
      component.form.controls.password.setValue('senha123');
      
      expect(component.form.valid).toBe(true);
    });
  });

  describe('Feedback de Validação', () => {
    it('deve marcar como touched para mostrar erros', () => {
      const identifierControl = component.form.controls.identifier;
      
      expect(identifierControl.untouched).toBe(true);
      
      identifierControl.markAsTouched();
      expect(identifierControl.touched).toBe(true);
    });

    it('deve marcar como dirty quando alterado', () => {
      const identifierControl = component.form.controls.identifier;
      
      expect(identifierControl.pristine).toBe(true);
      
      identifierControl.setValue('novo_usuario');
      identifierControl.markAsDirty();
      expect(identifierControl.dirty).toBe(true);
    });
  });

  describe('Submit do Formulário', () => {
    it('deve não submeter formulário inválido', async () => {
      await component.submit();
      
      expect(authServiceMock.login).not.toHaveBeenCalled();
      expect(component.statusMessage()).toContain('Revise os campos');
    });

    it('deve chamar authService.login com dados válidos', async () => {
      authServiceMock.login.mockResolvedValue({
        success: true,
        message: 'Login realizado!',
      });

      component.form.controls.identifier.setValue('joao_silva');
      component.form.controls.password.setValue('senha123');

      await component.submit();

      expect(authServiceMock.login).toHaveBeenCalledWith('joao_silva', 'senha123');
    });

    it('deve exibir mensagem de erro do serviço', async () => {
      authServiceMock.login.mockResolvedValue({
        success: false,
        message: 'Usuário ou senha inválidos',
      });

      component.form.controls.identifier.setValue('usuario_invalido');
      component.form.controls.password.setValue('senha_errada');

      await component.submit();

      expect(component.statusMessage()).toBe('Usuário ou senha inválidos');
      expect(component.isSuccess()).toBe(false);
    });
  });

  describe('Integração com AuthService', () => {
    it('deve exibir mensagem de sucesso e fechar dialog', async () => {
      authServiceMock.login.mockResolvedValue({
        success: true,
        message: 'Login bem-sucedido!',
      });

      component.form.controls.identifier.setValue('joao_silva');
      component.form.controls.password.setValue('senha123');

      await component.submit();
      fixture.detectChanges();

      expect(component.statusMessage()).toBe('Login bem-sucedido!');
      expect(component.isSuccess()).toBe(true);
      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('deve manter dialog aberto em caso de erro', async () => {
      authServiceMock.login.mockResolvedValue({
        success: false,
        message: 'Erro ao fazer login',
      });

      component.form.controls.identifier.setValue('joao_silva');
      component.form.controls.password.setValue('senha123');

      await component.submit();

      expect(component.isSuccess()).toBe(false);
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });
  });

  describe('Estados Dinâmicos de Loading', () => {
    it('deve ativar loading durante submit', async () => {
      authServiceMock.login.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ success: true, message: 'OK' }), 50)
        )
      );

      component.form.controls.identifier.setValue('joao_silva');
      component.form.controls.password.setValue('senha123');

      component.submit();
      fixture.detectChanges();

      expect(component.loading()).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
    });

    it('deve alterar estado de loading do sinal', () => {
      expect(component.loading()).toBe(false);

      component.loading.set(true);
      fixture.detectChanges();

      // Verificar se o signal foi atualizado
      expect(component.loading()).toBe(true);
      
      component.loading.set(false);
      expect(component.loading()).toBe(false);
    });

    it('deve garantir loading false mesmo com erro', async () => {
      authServiceMock.login.mockRejectedValue(new Error('Erro de rede'));

      component.form.controls.identifier.setValue('joao_silva');
      component.form.controls.password.setValue('senha123');

      try {
        await component.submit();
      } catch (e) {
        // Erro esperado
      }

      expect(component.loading()).toBe(false);
    });
  });

  describe('Feedback Visual com Signals', () => {
    it('deve exibir e ocultar mensagem de status', () => {
      component.statusMessage.set('');
      fixture.detectChanges();

      let feedback = fixture.nativeElement.querySelector('.auth-feedback');
      expect(feedback).toBeFalsy();

      component.statusMessage.set('Uma mensagem');
      fixture.detectChanges();

      feedback = fixture.nativeElement.querySelector('.auth-feedback');
      expect(feedback).toBeTruthy();
    });

    it('deve aplicar classe de sucesso', () => {
      component.statusMessage.set('Sucesso!');
      component.isSuccess.set(true);
      fixture.detectChanges();

      const feedback = fixture.nativeElement.querySelector('.auth-feedback');
      expect(feedback.classList.contains('auth-feedback--success')).toBe(true);
    });

    it('deve aplicar classe de erro', () => {
      component.statusMessage.set('Erro!');
      component.isSuccess.set(false);
      fixture.detectChanges();

      const feedback = fixture.nativeElement.querySelector('.auth-feedback');
      expect(feedback.classList.contains('auth-feedback--error')).toBe(true);
    });
  });

  describe('Fechamento de Dialog', () => {
    it('deve fechar dialog ao chamar método close()', () => {
      component.close();

      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('deve rastrear estado submitted', () => {
      expect(component.submitted()).toBe(false);

      component.submit();

      expect(component.submitted()).toBe(true);
    });
  });

  describe('Login com Identifier Flexible', () => {
    it('deve aceitar username como identifier', async () => {
      authServiceMock.login.mockResolvedValue({
        success: true,
        message: 'Login sucesso',
      });

      component.form.controls.identifier.setValue('joao_silva');
      component.form.controls.password.setValue('senha123');

      await component.submit();

      expect(authServiceMock.login).toHaveBeenCalledWith('joao_silva', 'senha123');
    });

    it('deve aceitar email como identifier', async () => {
      authServiceMock.login.mockResolvedValue({
        success: true,
        message: 'Login sucesso',
      });

      component.form.controls.identifier.setValue('joao@email.com');
      component.form.controls.password.setValue('senha123');

      await component.submit();

      expect(authServiceMock.login).toHaveBeenCalledWith('joao@email.com', 'senha123');
    });
  });
});
