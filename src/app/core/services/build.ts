import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { AuthService } from './auth';
import { BuilderService } from './builder';
import { SavedBuild } from '../models/saved-build.model';

// Caracteres sem ambiguidade visual (sem 0/O, 1/l/I) pra facilitar digitar o link à mão.
const SHARE_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

@Injectable({ providedIn: 'root' })
export class BuildService {
  private readonly storageKey = 'pc-builder-saved-builds';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly builder = inject(BuilderService);
  private readonly auth = inject(AuthService);
  // Guarda TODAS as builds de TODOS os usuários deste navegador.
  private readonly allBuildsState = signal<SavedBuild[]>(this.readBuilds());

  // "Minhas builds": só as do usuário logado no momento.
  readonly builds = computed(() => {
    const username = this.auth.currentUser()?.username;
    return username ? this.allBuildsState().filter((build) => build.owner === username) : [];
  });

  readonly activeBuildId = signal<string | null>(null);
  readonly activeBuild = computed(() => this.builds().find((build) => build.id === this.activeBuildId()) ?? null);

  // Builds públicas de qualquer usuário, mais recentes primeiro — "Builds da comunidade".
  readonly publicBuilds = computed(() => this.allBuildsState()
    .filter((build) => build.isPublic)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

  getById(id: string): SavedBuild | null {
    return this.allBuildsState().find((build) => build.id === id) ?? null;
  }

  // Busca pública por código de compartilhamento — não checa dono, qualquer um com o link acessa.
  getByShareId(shareId: string): SavedBuild | null {
    const normalized = shareId.trim();
    return this.allBuildsState().find((build) => build.shareId === normalized) ?? null;
  }

  byOwner(username: string): SavedBuild[] {
    const normalized = username.trim().toLowerCase();
    return this.allBuildsState()
      .filter((build) => build.owner.toLowerCase() === normalized)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getAllForAdmin(): SavedBuild[] {
    return this.allBuildsState();
  }

  removeForAdmin(id: string): void {
    this.allBuildsState.update((builds) => builds.filter((build) => build.id !== id));
    if (this.activeBuildId() === id) {
      this.activeBuildId.set(null);
    }
    this.persist();
  }

  save(name: string, id?: string | null): SavedBuild | null {
    const owner = this.auth.currentUser()?.username;
    const normalizedName = name.trim();
    if (!owner || !normalizedName || this.builder.selectedComponents().length === 0) {
      return null;
    }

    const existing = id
      ? this.allBuildsState().find((build) => build.id === id && build.owner === owner)
      : undefined;

    const build: SavedBuild = {
      id: existing?.id ?? this.createId(),
      owner,
      shareId: existing?.shareId ?? this.createUniqueShareId(),
      isPublic: existing?.isPublic ?? false,
      name: normalizedName,
      date: new Date().toISOString(),
      components: this.builder.snapshot(),
      total: this.builder.total(),
    };

    this.allBuildsState.update((current) => existing
      ? current.map((item) => item.id === build.id ? build : item)
      : [build, ...current]);
    this.activeBuildId.set(build.id);
    this.persist();
    return build;
  }

  open(id: string): SavedBuild | null {
    const owner = this.auth.currentUser()?.username;
    const build = this.allBuildsState().find((item) => item.id === id && item.owner === owner);
    if (!build) {
      return null;
    }

    this.builder.load(build.components);
    this.activeBuildId.set(build.id);
    return build;
  }

  remove(id: string): void {
    const owner = this.auth.currentUser()?.username;
    this.allBuildsState.update((current) => current.filter((build) => !(build.id === id && build.owner === owner)));
    if (this.activeBuildId() === id) {
      this.activeBuildId.set(null);
    }
    this.persist();
  }

  // Alterna se a build aparece em "Builds da comunidade". Só o próprio dono pode mudar isso.
  setPublic(id: string, isPublic: boolean): void {
    const owner = this.auth.currentUser()?.username;
    this.allBuildsState.update((current) => current.map((build) => build.id === id && build.owner === owner
      ? { ...build, isPublic }
      : build));
    this.persist();
  }

  clearActive(): void {
    this.activeBuildId.set(null);
  }

  // URL completa e pronta pra copiar/compartilhar.
  buildLink(shareId: string): string {
    if (this.isBrowser) {
      return `${window.location.origin}/build/${shareId}`;
    }
    return `/build/${shareId}`;
  }

  private createUniqueShareId(): string {
    let candidate = this.createShareId();
    const existingIds = new Set(this.allBuildsState().map((build) => build.shareId));
    while (existingIds.has(candidate)) {
      candidate = this.createShareId();
    }
    return candidate;
  }

  private createShareId(): string {
    const bytes = new Uint8Array(8);
    if (this.isBrowser && typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(bytes, (byte) => SHARE_ID_CHARS[byte % SHARE_ID_CHARS.length]).join('');
  }

  private readBuilds(): SavedBuild[] {
    if (!this.isBrowser) {
      return [];
    }

    const storedBuilds = localStorage.getItem(this.storageKey);
    if (!storedBuilds) {
      return [];
    }

    try {
      const parsedBuilds = JSON.parse(storedBuilds) as SavedBuild[];
      if (!Array.isArray(parsedBuilds)) {
        return [];
      }

      // Migração: builds salvas antes desta versão não tinham shareId/isPublic.
      return parsedBuilds
        .filter((build) => !!build.owner)
        .map((build) => ({
          ...build,
          shareId: build.shareId ?? this.createShareId(),
          isPublic: build.isPublic ?? false,
        }));
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.allBuildsState()));
    }
  }

  private createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}