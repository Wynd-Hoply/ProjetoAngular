import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { BuilderService } from './builder';
import { SavedBuild } from '../models/saved-build.model';

@Injectable({ providedIn: 'root' })
export class BuildService {
  private readonly storageKey = 'pc-builder-saved-builds';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly builder = inject(BuilderService);
  private readonly buildsState = signal<SavedBuild[]>(this.readBuilds());

  readonly builds = this.buildsState.asReadonly();
  readonly activeBuildId = signal<string | null>(null);
  readonly activeBuild = computed(() => this.buildsState().find((build) => build.id === this.activeBuildId()) ?? null);

  getById(id: string): SavedBuild | null {
    return this.buildsState().find((build) => build.id === id) ?? null;
  }

  save(name: string, id?: string | null): SavedBuild | null {
    const normalizedName = name.trim();
    if (!normalizedName || this.builder.selectedComponents().length === 0) {
      return null;
    }

    const existing = id ? this.buildsState().find((build) => build.id === id) : undefined;
    const build: SavedBuild = {
      id: existing?.id ?? this.createId(),
      name: normalizedName,
      date: new Date().toISOString(),
      components: this.builder.snapshot(),
      total: this.builder.total(),
    };

    this.buildsState.update((current) => existing
      ? current.map((item) => item.id === build.id ? build : item)
      : [build, ...current]);
    this.activeBuildId.set(build.id);
    this.persist();
    return build;
  }

  open(id: string): SavedBuild | null {
    const build = this.buildsState().find((item) => item.id === id);
    if (!build) {
      return null;
    }

    this.builder.load(build.components);
    this.activeBuildId.set(build.id);
    return build;
  }

  remove(id: string): void {
    this.buildsState.update((current) => current.filter((build) => build.id !== id));
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
      return Array.isArray(parsedBuilds) ? parsedBuilds : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.buildsState()));
    }
  }

  private createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}