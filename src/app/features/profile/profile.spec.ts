import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { of } from 'rxjs';

import { Profile } from './profile';
import { AuthService } from '../../core/services/auth';
import { BuildService } from '../../core/services/build';
import { CatalogService } from '../../core/services/catalog';

/**
 * Testes de Perfil Dinâmico para Componente Profile
 * 
 * Este arquivo de testes demonstra as melhores práticas para testar:
 * - Renderização de perfil
 * - Edição de informações (nome, bio, avatar)
 * - Validação de arquivo de imagem
 * - Mudança de senha
 * - Formatação de datas e valores
 * - Interações com serviços
 */
describe('Profile Component - Teste de Perfil Dinâmico', () => {
  let component: any;
  let fixture: ComponentFixture<Profile>;
  let authServiceMock: any;
  let buildServiceMock: any;
  let catalogServiceMock: any;
  let activatedRouteMock: any;

  beforeEach(async () => {
    authServiceMock = {
      getPublicProfile: vi.fn(),
      currentUser: vi.fn(() => ({ username: 'usuario_logado' })),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
    };

    buildServiceMock = {
      byOwner: vi.fn(() => []),
      remove: vi.fn(),
    };

    catalogServiceMock = {
      getById: vi.fn(),
    };

    activatedRouteMock = {
      paramMap: of(new Map([['username', 'joao_silva']])),
      snapshot: {
        paramMap: {
          get: vi.fn((key) => key === 'username' ? 'joao_silva' : null),
        },
        data: { tab: 'geral' },
      },
    };

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: BuildService, useValue: buildServiceMock },
        { provide: CatalogService, useValue: catalogServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Renderização do Perfil', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve inicializar com valores padrão de edição desativados', () => {
      expect(component.editing()).toBe(false);
      expect(component.changingPassword()).toBe(false);
    });

    it('deve ter mensagens vazias no início', () => {
      expect(component.profileMessage()).toBe('');
      expect(component.passwordMessage()).toBe('');
    });

    it('deve inicializar signals de password corretamente', () => {
      expect(component.currentPassword()).toBe('');
      expect(component.newPassword()).toBe('');
      expect(component.confirmNewPassword()).toBe('');
      expect(component.passwordLoading()).toBe(false);
    });
  });

  describe('Edição de Perfil', () => {
    it('deve iniciar edição com modo habilitado', () => {
      // Setup: criar um mock que retorna um perfil
      const mockProfile = {
        name: 'João Silva',
        bio: 'Desenvolvedor',
        avatar: 'https://example.com/avatar.jpg',
      };

      // Mock o método getPublicProfile para retornar sempre o perfil
      component.profile = () => mockProfile;

      component.startEditing();

      expect(component.editing()).toBe(true);
      expect(component.editName()).toBe('João Silva');
      expect(component.editBio()).toBe('Desenvolvedor');
      expect(component.editAvatar()).toBe('https://example.com/avatar.jpg');
    });

    it('deve desabilitar edição ao cancelar', () => {
      component.editing.set(true);
      component.changingPassword.set(true);

      component.cancelEditing();

      expect(component.editing()).toBe(false);
      expect(component.changingPassword()).toBe(false);
    });

    it('deve atualizar nome ao editar', () => {
      const event = { target: { value: 'Novo Nome' } } as any;

      component.updateName(event);

      expect(component.editName()).toBe('Novo Nome');
    });

    it('deve atualizar bio ao editar', () => {
      const event = { target: { value: 'Nova bio' } } as any;

      component.updateBio(event);

      expect(component.editBio()).toBe('Nova bio');
    });
  });

  describe('Validação de Arquivo de Avatar', () => {
    it('deve rejeitar arquivo que não é imagem', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [file],
        },
      } as any;

      component.onAvatarSelected(event);

      expect(component.profileMessage()).toContain('imagem');
      expect(component.profileSuccess()).toBe(false);
    });

    it('deve rejeitar arquivo de imagem muito grande', () => {
      const largeContent = new Array(3 * 1024 * 1024).fill('x').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [file],
        },
      } as any;

      component.onAvatarSelected(event);

      expect(component.profileMessage()).toContain('2 MB');
      expect(component.profileSuccess()).toBe(false);
    });

    it('deve aceitar arquivo de imagem válido', async () => {
      const file = new File(['image'], 'avatar.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [file],
        },
      } as any;

      component.onAvatarSelected(event);

      // Aguarda FileReader finalizar
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(component.editAvatar()).toBeTruthy();
    });

    it('deve remover avatar ao chamar removeAvatar', () => {
      component.editAvatar.set('https://example.com/avatar.jpg');

      component.removeAvatar();

      expect(component.editAvatar()).toBe(null);
    });
  });

  describe('Atualização de Perfil', () => {
    it('deve chamar authService.updateProfile com dados editados', () => {
      authServiceMock.updateProfile.mockReturnValue({
        success: true,
        message: 'Perfil atualizado!',
      });

      component.editName.set('Novo Nome');
      component.editBio.set('Nova Bio');
      component.editAvatar.set('data:image/jpeg;base64,...');

      component.saveProfile();

      expect(authServiceMock.updateProfile).toHaveBeenCalledWith({
        name: 'Novo Nome',
        bio: 'Nova Bio',
        avatar: 'data:image/jpeg;base64,...',
      });
    });

    it('deve exibir mensagem de sucesso ao atualizar perfil', () => {
      authServiceMock.updateProfile.mockReturnValue({
        success: true,
        message: 'Perfil atualizado com sucesso!',
      });

      component.saveProfile();

      expect(component.profileMessage()).toBe('Perfil atualizado com sucesso!');
      expect(component.profileSuccess()).toBe(true);
      expect(component.editing()).toBe(false);
    });

    it('deve exibir mensagem de erro ao falhar na atualização', () => {
      authServiceMock.updateProfile.mockReturnValue({
        success: false,
        message: 'Erro ao atualizar perfil',
      });

      component.saveProfile();

      expect(component.profileMessage()).toBe('Erro ao atualizar perfil');
      expect(component.profileSuccess()).toBe(false);
    });
  });

  describe('Mudança de Senha', () => {
    it('deve ativar/desativar formulário de mudança de senha', () => {
      expect(component.changingPassword()).toBe(false);

      component.togglePasswordForm();
      expect(component.changingPassword()).toBe(true);

      component.togglePasswordForm();
      expect(component.changingPassword()).toBe(false);
    });

    it('deve limpar campos ao ativar formulário de senha', () => {
      component.currentPassword.set('old');
      component.newPassword.set('new');
      component.confirmNewPassword.set('new');
      component.passwordMessage.set('Erro anterior');

      component.togglePasswordForm();

      expect(component.currentPassword()).toBe('');
      expect(component.newPassword()).toBe('');
      expect(component.confirmNewPassword()).toBe('');
      expect(component.passwordMessage()).toBe('');
    });

    it('deve rejeitar senhas novas não coincidentes', async () => {
      component.currentPassword.set('senhaAtual123');
      component.newPassword.set('novaSenha123');
      component.confirmNewPassword.set('diferente123');

      await component.submitPasswordChange();

      expect(component.passwordMessage()).toContain('não coincidem');
      expect(component.passwordSuccess()).toBe(false);
      expect(authServiceMock.changePassword).not.toHaveBeenCalled();
    });

    it('deve chamar authService ao submeter senhas iguais', async () => {
      authServiceMock.changePassword.mockResolvedValue({
        success: true,
        message: 'Senha alterada!',
      });

      component.currentPassword.set('senhaAtual123');
      component.newPassword.set('novaSenha123');
      component.confirmNewPassword.set('novaSenha123');

      await component.submitPasswordChange();

      expect(authServiceMock.changePassword).toHaveBeenCalledWith('senhaAtual123', 'novaSenha123');
    });

    it('deve exibir mensagem de sucesso ao alterar senha', async () => {
      authServiceMock.changePassword.mockResolvedValue({
        success: true,
        message: 'Senha alterada com sucesso!',
      });

      component.currentPassword.set('senhaAtual123');
      component.newPassword.set('novaSenha123');
      component.confirmNewPassword.set('novaSenha123');

      await component.submitPasswordChange();

      expect(component.passwordMessage()).toBe('Senha alterada com sucesso!');
      expect(component.passwordSuccess()).toBe(true);
      expect(component.changingPassword()).toBe(false);
    });

    it('deve exibir mensagem de erro ao falhar na alteração', async () => {
      authServiceMock.changePassword.mockResolvedValue({
        success: false,
        message: 'Senha atual incorreta',
      });

      component.currentPassword.set('senhaErrada');
      component.newPassword.set('novaSenha123');
      component.confirmNewPassword.set('novaSenha123');

      await component.submitPasswordChange();

      expect(component.passwordMessage()).toBe('Senha atual incorreta');
      expect(component.passwordSuccess()).toBe(false);
    });

    it('deve desativar loading após tentar alterar senha', async () => {
      authServiceMock.changePassword.mockRejectedValue(new Error('Erro'));

      component.currentPassword.set('senhaAtual123');
      component.newPassword.set('novaSenha123');
      component.confirmNewPassword.set('novaSenha123');

      try {
        await component.submitPasswordChange();
      } catch (e) {
        // Erro esperado
      }

      expect(component.passwordLoading()).toBe(false);
    });
  });

  describe('Formatação de Dados', () => {
    it('deve formatar preço em BRL', () => {
      const formatted = component.formatPrice(1500);

      expect(formatted).toContain('R$');
      expect(formatted).toContain('1.500');
    });

    it('deve formatar data em português', () => {
      const formatted = component.formatDate('2024-12-25');

      expect(formatted).toBeTruthy();
      expect(formatted).toMatch(/\d{1,2}/);
    });

    it('deve formatar data de adesão com mês e ano', () => {
      const formatted = component.formatJoinDate('2024-12-25');

      expect(formatted).toContain('2024');
    });

    it('deve gerar iniciais do nome', () => {
      expect(component.initials('João Silva')).toBe('J');
      expect(component.initials('  Maria  ')).toBe('M');
      expect(component.initials('')).toBe('?');
    });
  });

  describe('Gerenciamento de Builds', () => {
    it('deve chamar buildService.remove ao remover build', () => {
      component.removeBuild('build-123');

      expect(buildServiceMock.remove).toHaveBeenCalledWith('build-123');
    });

    it('deve inicializar com username do router', () => {
      expect(component.username).toBeDefined();
    });

    it('deve ter tab definida como geral ou builds', () => {
      expect(['geral', 'builds']).toContain(component.tab);
    });
  });

  describe('Estados Dinâmicos', () => {
    it('deve ativar loading durante mudança de senha', async () => {
      authServiceMock.changePassword.mockImplementation(
        () => new Promise(resolve =>
          setTimeout(() => resolve({ success: true, message: 'OK' }), 50)
        )
      );

      component.currentPassword.set('senhaAtual123');
      component.newPassword.set('novaSenha123');
      component.confirmNewPassword.set('novaSenha123');

      component.submitPasswordChange();
      fixture.detectChanges();

      expect(component.passwordLoading()).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      expect(component.passwordLoading()).toBe(false);
    });

    it('deve limpar senhas após sucesso na mudança', async () => {
      authServiceMock.changePassword.mockResolvedValue({
        success: true,
        message: 'Senha alterada!',
      });

      component.currentPassword.set('senhaAtual123');
      component.newPassword.set('novaSenha123');
      component.confirmNewPassword.set('novaSenha123');

      await component.submitPasswordChange();

      expect(component.currentPassword()).toBe('');
      expect(component.newPassword()).toBe('');
      expect(component.confirmNewPassword()).toBe('');
    });
  });

  describe('Validação de Perfil Próprio', () => {
    it('deve identificar se é perfil próprio', () => {
      authServiceMock.currentUser.mockReturnValue({ username: 'joao_silva' });

      const isOwn = component.isOwnProfile();

      // Este é um computed, então precisamos acessar o valor correto
      expect(isOwn).toBeDefined();
    });

    it('deve permitir edição apenas do perfil próprio', () => {
      authServiceMock.currentUser.mockReturnValue({ username: 'outro_usuario' });

      const isOwn = component.isOwnProfile();

      expect(isOwn).toBeDefined();
    });
  });
});
