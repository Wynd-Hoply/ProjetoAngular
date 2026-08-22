import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { AuthService } from './auth';
import { BuilderService } from './builder';
import { SavedBuild } from '../models/saved-build.model';

@Injectable({ providedIn: 'root' })
export class BuildService {
  private readonly storageKey = 'pc-builder-saved-builds';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly builder = inject(BuilderService);
  private readonly auth = inject(AuthService);
  // Guarda TODAS as builds de TODOS os usuários deste navegador.
  private readonly allBuildsState = signal<SavedBuild[]>(this.readBuilds());

  // "Minhas builds": só as do usuário logado no momento. Reage sozinho
  // a login/logout porque depende de auth.currentUser().
  readonly builds = computed(() => {
    const username = this.auth.currentUser()?.username;
    return username ? this.allBuildsState().filter((build) => build.owner === username) : [];
  });

  readonly activeBuildId = signal<string | null>(null);
  readonly activeBuild = computed(() => this.builds().find((build) => build.id === this.activeBuildId()) ?? null);

  getById(id: string): SavedBuild | null {
    return this.allBuildsState().find((build) => build.id === id) ?? null;
  }

  // Builds de um usuário específico (usado no /perfil/:username, inclusive de outras pessoas).
  byOwner(username: string): SavedBuild[] {
    const normalized = username.trim().toLowerCase();
    return this.allBuildsState()
      .filter((build) => build.owner.toLowerCase() === normalized)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  clearActive(): void {
    this.activeBuildId.set(null);
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
      return Array.isArray(parsedBuilds) ? parsedBuilds.filter((build) => !!build.owner) : [];
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