import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { CatalogService } from './catalog';
import { Component, ComponentCategory } from '../models/component.model';

@Injectable({ providedIn: 'root' })
export class BuilderService {
  private readonly storageKey = 'pc-builder-current-build';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly catalog = inject(CatalogService);
  private readonly selectedState = signal<Partial<Record<ComponentCategory, number>>>(this.readBuild());

  readonly selected = computed(() => this.resolveSelected());
  readonly selectedComponents = computed(() => Object.values(this.selected()).filter((component): component is Component => component !== undefined));
  readonly total = computed(() => this.selectedComponents().reduce((total, component) => total + component.price, 0));

  add(component: Component): void {
    this.selectedState.update((current) => ({ ...current, [component.category]: component.id }));
    this.persist();
  }

  remove(category: ComponentCategory): void {
    this.selectedState.update((current) => {
      const next = { ...current };
      delete next[category];
      return next;
    });
    this.persist();
  }

  clear(): void {
    this.selectedState.set({});
    this.persist();
  }

  snapshot(): Partial<Record<ComponentCategory, number>> {
    return { ...this.selectedState() };
  }

  load(snapshot: Partial<Record<ComponentCategory, number>>): void {
    this.selectedState.set({ ...snapshot });
    this.persist();
  }

  private readBuild(): Partial<Record<ComponentCategory, number>> {
    if (!this.isBrowser) {
      return {};
    }

    const storedBuild = localStorage.getItem(this.storageKey);
    if (!storedBuild) {
      return {};
    }

    try {
      const parsedBuild = JSON.parse(storedBuild) as Partial<Record<ComponentCategory, number | Component>>;
      if (!parsedBuild || typeof parsedBuild !== 'object') {
        return {};
      }

      return Object.entries(parsedBuild).reduce<Partial<Record<ComponentCategory, number>>>((build, [category, value]) => {
        const id = typeof value === 'number' ? value : value?.id;
        if (id !== undefined) {
          build[category as ComponentCategory] = id;
        }
        return build;
      }, {});
    } catch {
      return {};
    }
  }

  private persist(): void {
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.selectedState()));
    }
  }

  private resolveSelected(): Partial<Record<ComponentCategory, Component>> {
    return Object.entries(this.selectedState()).reduce<Partial<Record<ComponentCategory, Component>>>((selected, [category, id]) => {
      const component = id === undefined ? undefined : this.catalog.getById(id);
      if (component) {
        selected[category as ComponentCategory] = component;
      }
      return selected;
    }, {});
  }
}
