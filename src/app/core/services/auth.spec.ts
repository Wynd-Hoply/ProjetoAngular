import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService, AuthUser } from './auth';

const user: AuthUser = {
  username: 'maria',
  name: 'Maria Silva',
  email: 'maria@example.com',
  password: 'senha123',
  bio: 'Montadora de PCs',
  avatar: null,
  joinedAt: '2026-01-01T00:00:00.000Z',
  isAdmin: false,
};

const admin: AuthUser = {
  ...user,
  username: 'admin',
  name: 'Administrador',
  email: 'admin@pcraft.local',
  password: 'admin123',
  isAdmin: true,
};

function createStorage(): Storage {
  // O Map mantem o estado do storage controlado e reiniciavel em cada teste.
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() {
      return values.size;
    },
  } as Storage;
}

describe('AuthService', () => {
  let storage: Storage;
// antes de cada teste restuarar mocks e criar um novo storage controlado, injetando-o no serviço.
  beforeEach(() => {
    vi.restoreAllMocks();
    storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    // O serviço deteccta o navegador pelo PLATFORM_ID e acessa o storage global.
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
  });
//   depois de cada teste restaurar os stubs globais para não afetar outros testes.
  afterEach(() => vi.unstubAllGlobals());

  function injectService(users: AuthUser[] = [user, admin], session?: object): AuthService {
    storage.setItem('project-auth-users', JSON.stringify(users));
    if (session) {
      storage.setItem('project-auth-session', JSON.stringify(session));
    }
    return TestBed.inject(AuthService);
  }


  
  it('faz login por email e persiste uma sessão sem senha', async () => {
    const service = injectService();

    const result = await service.login(' MARIA@EXAMPLE.COM ', 'senha123');

    expect(result).toEqual({ success: true, message: 'Bem-vindo, Maria Silva.' });
    expect(service.currentUser()).toEqual(expect.objectContaining({ username: 'maria', isAdmin: false }));
    expect(JSON.parse(storage.getItem('project-auth-session')!)).not.toHaveProperty('password');
  });

  it('rejeita usuário inexistente e senha incorreta', async () => {
    const service = injectService();

    await expect(service.login('missing', 'senha123')).resolves.toEqual({
      success: false,
      message: 'Email/usuário ou senha inválidos.',
    });
    await expect(service.login('maria', 'errada')).resolves.toEqual({
      success: false,
      message: 'Email/usuário ou senha inválidos.',
    });
  });

  it('registra uma conta, normaliza email e inicia a sessão', async () => {
    const service = injectService([admin]);

    const result = await service.register('  Ana  ', 'ana_pc', ' ANA@EXAMPLE.COM ', 'senha456');

    expect(result.success).toBe(true);
    expect(service.currentUser()).toEqual(expect.objectContaining({
      username: 'ana_pc',
      name: 'Ana',
      email: 'ana@example.com',
    }));
    expect(JSON.parse(storage.getItem('project-auth-users')!)).toEqual(
      expect.arrayContaining([expect.objectContaining({ username: 'ana_pc', password: 'senha456' })]),
    );
  });

  it('rejeita email e username já existentes no registro', async () => {
    const service = injectService();

    await expect(service.register('Outra', 'outra', 'MARIA@example.com', 'senha456')).resolves.toEqual({
      success: false,
      message: 'Já existe uma conta cadastrada com este email.',
    });
    await expect(service.register('Outra', ' MARIA ', 'outra@example.com', 'senha456')).resolves.toEqual({
      success: false,
      message: 'Esse nome de usuário já está em uso.',
    });
  });

  it('faz logout e remove a sessão persistida', () => {
    const service = injectService([user], user);

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('project-auth-session');
  });

  it('altera a senha apenas com a senha atual correta', async () => {
    const service = injectService([user], user);

    await expect(service.changePassword('errada', 'nova123')).resolves.toEqual({
      success: false,
      message: 'Senha atual incorreta.',
    });
    await expect(service.changePassword('senha123', 'nova123')).resolves.toEqual({
      success: true,
      message: 'Senha alterada com sucesso.',
    });
    await expect(service.login('maria', 'nova123')).resolves.toMatchObject({ success: true });
  });

  it('atualiza e persiste nome, bio limitada e avatar', () => {
    const service = injectService([user], user);

    const result = service.updateProfile({ name: ' Maria Nova ', bio: 'x'.repeat(300), avatar: 'avatar.png' });

    expect(result.success).toBe(true);
    expect(service.currentUser()).toEqual(expect.objectContaining({ name: 'Maria Nova', bio: 'x'.repeat(280), avatar: 'avatar.png' }));
    expect(JSON.parse(storage.getItem('project-auth-users')!)[0]).toEqual(expect.objectContaining({ name: 'Maria Nova', bio: 'x'.repeat(280) }));
  });

  it('retorna perfil público sem senha e retorna null para desconhecido', () => {
    const service = injectService();

    expect(service.getPublicProfile(' MARIA ')).toEqual({
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      joinedAt: user.joinedAt,
    });
    expect(service.getPublicProfile('unknown')).toBeNull();
    expect(service.getPublicProfile('maria')).not.toHaveProperty('password');
    expect(service.getPublicProfile('maria')).not.toHaveProperty('email');
    expect(service.getPublicProfile('maria')).not.toHaveProperty('isAdmin');
  });

  it('lista, remove e promove usuários nos fluxos administrativos', () => {
    const service = injectService([user, admin], user);

    expect(service.getUsersForAdmin()).toHaveLength(2);
    service.setAdminForAdmin('maria', true);
    expect(service.isAdmin()).toBe(true);
    service.removeUserForAdmin('admin');

    expect(service.getUsersForAdmin().map((item) => item.username)).toEqual(['maria']);
    expect(storage.setItem).toHaveBeenCalledWith('project-auth-users', expect.any(String));
  });

  it('mantém os métodos administrativos como operações internas mesmo sem sessão admin', () => {
    // Esses métodos não autorizam por conta própria; a autorização é responsabilidade do AdminService.
    const service = injectService([user]);

    service.setAdminForAdmin('maria', true);
    expect(service.getUsersForAdmin()[0].isAdmin).toBe(true);
    service.removeUserForAdmin('maria');
    expect(service.getUsersForAdmin().map((item) => item.username)).toEqual(['admin']);
  });
});
