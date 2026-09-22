import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BuildService } from './build';
import { AuthService, AuthSession } from './auth';
import { BuilderService } from './builder';
import { Component } from '../models/component.model';
import { SavedBuild } from '../models/saved-build.model';

const component: Component = {
  id: 101,
  name: 'CPU de teste',
  category: 'cpu',
  brand: 'Teste',
  price: 999.9,
  performanceScore: 80,
  powerDrawWatts: 65,
  image: 'cpu.png',
  specifications: {},
};

const session: AuthSession = {
  username: 'maria',
  name: 'Maria',
  email: 'maria@example.com',
  bio: '',
  avatar: null,
  joinedAt: '2026-01-01T00:00:00.000Z',
  isAdmin: false,
};

const otherBuild: SavedBuild = {
  id: 'other-id',
  owner: 'joao',
  shareId: 'JOAO1234',
  isPublic: true,
  name: 'Build pública',
  date: '2026-01-02T00:00:00.000Z',
  components: { cpu: 101 },
  total: 999.9,
};

function createStorage(): Storage {
  // O stub evita vazamento entre testes e permite verificar cada persistência.
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

describe('BuildService', () => {
  let storage: Storage;
  let currentUser: ReturnType<typeof signal<AuthSession | null>>;
  let builder: {
    selectedComponents: ReturnType<typeof signal<Component[]>>;
    snapshot: ReturnType<typeof vi.fn>;
    total: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
  };
  let service: BuildService;

  beforeEach(() => {
    vi.restoreAllMocks();
    storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    let randomCall = 0;
    // Cada chamada produz bytes previsíveis, permitindo testar unicidade sem aleatoriedade.
    vi.stubGlobal('crypto', {
      getRandomValues: vi.fn((bytes: Uint8Array) => {
        randomCall += 1;
        bytes.fill(randomCall);
        return bytes;
      }),
    });
    currentUser = signal<AuthSession | null>(session);
    builder = {
      // O BuilderService é isolado para o spec validar apenas o comportamento de builds salvas.
      selectedComponents: signal([component]),
      snapshot: vi.fn(() => ({ cpu: component.id })),
      total: vi.fn(() => component.price),
      load: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: { currentUser } },
        { provide: BuilderService, useValue: builder },
      ],
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  function injectService(builds: SavedBuild[] = []): BuildService {
    storage.setItem('pc-builder-saved-builds', JSON.stringify(builds));
    return TestBed.inject(BuildService);
  }

  it('salva, persiste e reabre uma build do usuário', () => {
    service = injectService();

    const saved = service.save('  Minha build  ');
    const opened = service.open(saved!.id);

    expect(saved).toEqual(expect.objectContaining({
      owner: 'maria',
      name: 'Minha build',
      shareId: 'BBBBBBBB',
      components: { cpu: 101 },
      total: 999.9,
    }));
    expect(opened).toEqual(saved);
    expect(builder.load).toHaveBeenCalledWith({ cpu: 101 });
    expect(service.activeBuildId()).toBe(saved!.id);
    expect(storage.setItem).toHaveBeenCalledWith('pc-builder-saved-builds', expect.any(String));
  });

  it('não salva sem usuário, nome ou componentes', () => {
    builder.selectedComponents.set([]);
    service = injectService();

    expect(service.save('build')).toBeNull();
    currentUser.set(null);
    expect(service.save('build')).toBeNull();
    expect(service.open('missing')).toBeNull();
  });

  it('gera share IDs determinísticos e únicos ao salvar duas builds', () => {
    service = injectService();

    const first = service.save('Primeira');
    const second = service.save('Segunda');

    expect(first!.shareId).toBe('BBBBBBBB');
    expect(second!.shareId).toBe('CCCCCCCC');
  });

  it('encontra builds por id e share id, ou retorna null', () => {
    service = injectService([otherBuild]);

    expect(service.getById('other-id')).toEqual(otherBuild);
    expect(service.getById('missing')).toBeNull();
    expect(service.getByShareId(' JOAO1234 ')).toEqual(otherBuild);
    expect(service.getByShareId('missing')).toBeNull();
    expect(service.getAllForAdmin()).toEqual([otherBuild]);
  });

  it('remove a própria build, remove build administrativa e limpa a ativa', () => {
    const mine = { ...otherBuild, id: 'mine-id', owner: 'maria', isPublic: false };
    service = injectService([mine, otherBuild]);
    service.activeBuildId.set('mine-id');

    service.remove('other-id');
    expect(service.getById('other-id')).toEqual(otherBuild);
    service.remove('mine-id');
    expect(service.getById('mine-id')).toBeNull();
    expect(service.activeBuildId()).toBeNull();

    service.activeBuildId.set('other-id');
    service.removeForAdmin('other-id');
    expect(service.getById('other-id')).toBeNull();
    expect(service.activeBuildId()).toBeNull();
  });

  it('altera visibilidade apenas da build do usuário e limpa a build ativa', () => {
    const mine = { ...otherBuild, id: 'mine-id', owner: 'maria', isPublic: false };
    service = injectService([mine, otherBuild]);

    service.setPublic('other-id', false);
    expect(service.getById('other-id')!.isPublic).toBe(true);
    service.setPublic('mine-id', true);
    expect(service.getById('mine-id')!.isPublic).toBe(true);

    service.activeBuildId.set('mine-id');
    service.clearActive();
    expect(service.activeBuildId()).toBeNull();
  });

  it('expõe builds do dono, públicas ordenadas e link compartilhável', () => {
    const mine = { ...otherBuild, id: 'mine-id', owner: 'maria', date: '2026-01-03T00:00:00.000Z' };
    service = injectService([otherBuild, mine]);

    expect(service.builds()).toEqual([mine]);
    expect(service.byOwner(' MARIA ')).toEqual([mine]);
    expect(service.publicBuilds().map((build) => build.id)).toEqual(['mine-id', 'other-id']);
    expect(service.buildLink('ABC123')).toBe(`${window.location.origin}/build/ABC123`);
  });
});
