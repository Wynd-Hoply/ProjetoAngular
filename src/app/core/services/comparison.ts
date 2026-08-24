import { computed, inject, Injectable, signal } from '@angular/core';

import { CatalogService } from './catalog';
import { Component } from '../models/component.model';

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  static readonly maxItems = 4;
  readonly maxItems = ComparisonService.maxItems;

  private readonly catalog = inject(CatalogService);
  private readonly selectedIds = signal<number[]>([]);
  readonly selected = computed(() => this.selectedIds()
    .map((id) => this.catalog.getById(id))
    .filter((component): component is Component => component !== undefined));

  toggle(component: Component): void {
    if (this.isSelected(component.id)) {
      this.remove(component.id);
      return;
    }

    if (this.isFull()) {
      return;
    }

    this.selectedIds.update((current) => [...current, component.id]);
  }

  remove(id: number): void {
    this.selectedIds.update((current) => current.filter((selectedId) => selectedId !== id));
  }

  clear(): void {
    this.selectedIds.set([]);
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  isFull(): boolean {
    return this.selectedIds().length >= ComparisonService.maxItems;
  }
}
