import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme';

function createStorage(): Storage {
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

function setMatchMedia(matches?: boolean): void {
  if (matches === undefined) {
    Reflect.deleteProperty(window, 'matchMedia');
    return;
  }

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => ({
      matches,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('ThemeService', () => {
  let storage: Storage;
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    vi.restoreAllMocks();
    storage = createStorage();
    originalMatchMedia = window.matchMedia;
    vi.stubGlobal('localStorage', storage);
    document.body.className = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.className = '';

    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  function createBrowserService(savedTheme?: 'dark' | 'light'): ThemeService {
    if (savedTheme) {
      storage.setItem('user-theme', savedTheme);
    }

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    return TestBed.inject(ThemeService);
  }

  it('lê o tema salvo e aplica dark-mode ao iniciar com tema escuro', () => {
    const service = createBrowserService('dark');

    expect(service.isDarkMode()).toBe(true);
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(document.body.classList.contains('light-mode')).toBe(false);
    expect(storage.getItem).toHaveBeenCalledWith('user-theme');
  });

  it('lê o tema salvo e aplica light-mode ao iniciar com tema claro', () => {
    const service = createBrowserService('light');

    expect(service.isDarkMode()).toBe(false);
    expect(document.body.classList.contains('light-mode')).toBe(true);
    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  it('usa a preferência do sistema quando não existe tema salvo', () => {
    setMatchMedia(true);
    const service = createBrowserService();

    expect(service.isDarkMode()).toBe(true);
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(storage.getItem).toHaveBeenCalledWith('user-theme');
  });

  it('cai para light-mode quando a preferência do sistema está desligada', () => {
    setMatchMedia(false);
    const service = createBrowserService();

    expect(service.isDarkMode()).toBe(false);
    expect(document.body.classList.contains('light-mode')).toBe(true);
    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  it('cai para light-mode quando não há matchMedia disponível', () => {
    setMatchMedia();
    const service = createBrowserService();

    expect(service.isDarkMode()).toBe(false);
    expect(document.body.classList.contains('light-mode')).toBe(true);
  });

  it('alterna o tema e persiste o novo valor', () => {
    setMatchMedia();
    const service = createBrowserService('light');

    service.toggleTheme();

    expect(service.isDarkMode()).toBe(true);
    expect(storage.setItem).toHaveBeenLastCalledWith('user-theme', 'dark');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(document.body.classList.contains('light-mode')).toBe(false);
  });

  it('não toca no DOM nem no storage quando roda fora do navegador', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const service = TestBed.inject(ThemeService);

    service.toggleTheme();

    expect(service.isDarkMode()).toBe(true);
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(document.body.className).toBe('');
  });
});


