import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Register } from './register';
import { AuthService } from '../../../core/services/auth';

/**
 * Testes de Formulário Dinâmico para Componente Register
 * 
 * Este arquivo de testes demonstra as melhores práticas para testar:
 * - Renderização de formulários
 * - Validação dinâmica de campos
 * - Feedback visual
 * - Integração com serviços
 * - Estados do formulário
 */
describe('Register Component - Teste de Formulário Dinâmico', () => {
  let component: any; // Use 'any' to access protected members during testing
  let fixture: ComponentFixture<Register>;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Renderização do Formulário', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve renderizar todos os campos do formulário', () => {
      const form = fixture.nativeElement.querySelector('.auth-form');
      const inputs = form.querySelectorAll('input');

      expect(inputs.length).toBe(5);
      expect(inputs[0].placeholder).toContain('Seu nome');
      expect(inputs[1].placeholder).toContain('usuario');
      expect(inputs[2].type).toBe('email');
      expect(inputs[3].type).toBe('password');
      expect(inputs[4].type).toBe('password');
    });

    it('deve renderizar botão submit', () => {
      const button = fixture.nativeElement.querySelector('button.auth-submit');
      expect(button?.textContent).toContain('Criar conta');
    });
  });

  describe('Validação Dinâmica de Campos', () => {
    it('deve validar nome como inválido quando vazio', () => {
      const control = component.form.controls.name;
      control.setValue('');
      expect(control.invalid).toBe(true);
    });

    it('deve validar nome como inválido quando menor que 3 caracteres', () => {
      const control = component.form.controls.name;
      control.setValue('ab');
      expect(control.invalid).toBe(true);
    });

    it('deve validar nome como válido com 3+ caracteres', () => {
      const control = component.form.controls.name;
      control.setValue('João');
      expect(control.valid).toBe(true);
    });

    it('deve validar username com padrão regex', () => {
      const control = component.form.controls.username;

      // Inválido: muito curto
      control.setValue('ab');
      expect(control.invalid).toBe(true);

      // Inválido: caracteres especiais
      control.setValue('user@123');
      expect(control.invalid).toBe(true);

      // Válido: letras, números e underscore
      control.setValue('user_123');
      expect(control.valid).toBe(true);
    });

    it('deve validar email', () => {
      const control = component.form.controls.email;

      control.setValue('invalido');
      expect(control.invalid).toBe(true);

      control.setValue('valido@email.com');
      expect(control.valid).toBe(true);
    });

    it('deve validar senha com mínimo de 6 caracteres', () => {
      const control = component.form.controls.password;

      control.setValue('123');
      expect(control.invalid).toBe(true);

      control.setValue('123456');
      expect(control.valid).toBe(true);
    });

    it('deve rejeitar confirmPassword vazia', () => {
      const control = component.form.controls.confirmPassword;

      control.setValue('');
      expect(control.invalid).toBe(true);

      control.setValue('senha123');
      expect(control.valid).toBe(true);
    });
  });

  describe('Estado Completo do Formulário', () => {
    it('deve ser inválido quando um campo está vazio', () => {
      component.form.controls.name.setValue('João Silva');
      component.form.controls.username.setValue('joao_silva');
      component.form.controls.email.setValue('joao@email.com');
      component.form.controls.password.setValue('senha123');
      // confirmPassword vazio

      expect(component.form.invalid).toBe(true);
    });

    it('deve ser válido quando todos os campos estão preenchidos', () => {
      component.form.controls.name.setValue('João Silva');
      component.form.controls.username.setValue('joao_silva');
      component.form.controls.email.setValue('joao@email.com');
      component.form.controls.password.setValue('senha123');
      component.form.controls.confirmPassword.setValue('senha123');

      expect(component.form.valid).toBe(true);
    });
  });

  describe('Feedback de Validação Dinâmica', () => {
    it('deve marcar como touched para mostrar erros', () => {
      const nameControl = component.form.controls.name;

      expect(nameControl.untouched).toBe(true);

      nameControl.markAsTouched();
      expect(nameControl.touched).toBe(true);
    });

    it('deve marcar como dirty quando alterado', () => {
      const nameControl = component.form.controls.name;

      expect(nameControl.pristine).toBe(true);

      nameControl.setValue('João');
      nameControl.markAsDirty();
      expect(nameControl.dirty).toBe(true);
    });
  });

  describe('Submit do Formulário', () => {
    it('deve não submeter formulário inválido', async () => {
      await component.submit();

      expect(authServiceMock.register).not.toHaveBeenCalled();
      expect(component.statusMessage()).toContain('Revise os campos');
    });

    it('deve chamar authService com dados válidos', async () => {
      authServiceMock.register.mockResolvedValue({
        success: true,
        message: 'Sucesso',
      });

      component.form.controls.name.setValue('João Silva');
      component.form.controls.username.setValue('joao_silva');
      component.form.controls.email.setValue('joao@email.com');
      component.form.controls.password.setValue('senha123');
      component.form.controls.confirmPassword.setValue('senha123');

      await component.submit();

      expect(authServiceMock.register).toHaveBeenCalledWith(
        'João Silva',
        'joao_silva',
        'joao@email.com',
        'senha123'
      );
    });

    it('deve exibir erro quando senhas não correspondem', async () => {
      component.form.controls.name.setValue('João Silva');
      component.form.controls.username.setValue('joao_silva');
      component.form.controls.email.setValue('joao@email.com');
      component.form.controls.password.setValue('senha123');
      component.form.controls.confirmPassword.setValue('diferente');

      await component.submit();

      expect(authServiceMock.register).not.toHaveBeenCalled();
      expect(component.statusMessage()).toContain('senhas informadas precisam ser iguais');
      expect(component.isSuccess()).toBe(false);
    });
  });

  describe('Integração com AuthService', () => {
    it('deve exibir mensagem de sucesso', async () => {
      authServiceMock.register.mockResolvedValue({
        success: true,
        message: 'Cadastro realizado!',
      });

      component.form.controls.name.setValue('João Silva');
      component.form.controls.username.setValue('joao_silva');
      component.form.controls.email.setValue('joao@email.com');
      component.form.controls.password.setValue('senha123');
      component.form.controls.confirmPassword.setValue('senha123');

      await component.submit();
      fixture.detectChanges();

      expect(component.statusMessage()).toBe('Cadastro realizado!');
      expect(component.isSuccess()).toBe(true);
    });

    it('deve exibir mensagem de erro do serviço', async () => {
      authServiceMock.register.mockResolvedValue({
        success: false,
        message: 'Email já cadastrado',
      });

      component.form.controls.name.setValue('João');
      component.form.controls.username.setValue('joao123');
      component.form.controls.email.setValue('joao@email.com');
      component.form.controls.password.setValue('senha123');
      component.form.controls.confirmPassword.setValue('senha123');

      await component.submit();
      fixture.detectChanges();

      expect(component.statusMessage()).toBe('Email já cadastrado');
      expect(component.isSuccess()).toBe(false);
    });
  });

  describe('Estados Dinâmicos de Loading', () => {
    it('deve ativar loading durante submit', async () => {
      authServiceMock.register.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'OK' }), 50))
      );

      component.form.controls.name.setValue('João Silva');
      component.form.controls.username.setValue('joao_silva');
      component.form.controls.email.setValue('joao@email.com');
      component.form.controls.password.setValue('senha123');
      component.form.controls.confirmPassword.setValue('senha123');

      component.submit();
      fixture.detectChanges();

      expect(component.loading()).toBe(true);

      // Aguarda a promise resolver
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
    });

    it('deve alterar texto do botão durante loading', () => {
      expect(component.loading()).toBe(false);
      expect(fixture.nativeElement.querySelector('button').textContent).toContain('Criar conta');

      component.loading.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('button').textContent).toContain('Criando...');
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
      expect(feedback.classList.contains('auth-feedback--error')).toBe(false);
    });

    it('deve aplicar classe de erro', () => {
      component.statusMessage.set('Erro!');
      component.isSuccess.set(false);
      fixture.detectChanges();

      const feedback = fixture.nativeElement.querySelector('.auth-feedback');
      expect(feedback.classList.contains('auth-feedback--error')).toBe(true);
      expect(feedback.classList.contains('auth-feedback--success')).toBe(false);
    });
  });

  describe('Rastreamento de Submit', () => {
    it('deve rastrear se foi submetido', () => {
      expect(component.submitted()).toBe(false);

      component.submit();

      expect(component.submitted()).toBe(true);
    });
  });
});
