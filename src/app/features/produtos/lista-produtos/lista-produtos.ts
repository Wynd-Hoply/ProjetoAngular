import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BuilderService } from '../../../core/services/builder';
import { CatalogService } from '../../../core/services/catalog';
import { ComparisonService } from '../../../core/services/comparison';
import { CatalogFilters, CatalogSort } from '../../../core/models/catalog.model';
import { Component as CatalogComponent, ComponentCategory } from '../../../core/models/component.model';

const categoryLabels: Record<ComponentCategory, string> = {
  cpu: 'Processadores',
  gpu: 'Placas de vídeo',
  motherboard: 'Placas-mãe',
  ram: 'Memórias RAM',
  storage: 'Armazenamento',
  psu: 'Fontes',
  case: 'Gabinetes',
  cooler: 'Coolers',
};

@Component({
  selector: 'app-lista-produtos',
  imports: [RouterLink],
  templateUrl: './lista-produtos.html',
  styleUrl: './lista-produtos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaProdutos {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  readonly builder = inject(BuilderService);
  readonly comparison = inject(ComparisonService);

  readonly category = signal<ComponentCategory | undefined>(this.readCategory());
  readonly search = signal('');
  readonly brand = signal('');
  readonly minPrice = signal<number | undefined>(undefined);
  readonly maxPrice = signal<number | undefined>(undefined);
  readonly sort = signal<CatalogSort>('name-asc');
  readonly minVram = signal<number | undefined>(undefined);
  readonly minCapacity = signal<number | undefined>(undefined);
  readonly minWattage = signal<number | undefined>(undefined);

  readonly categories = Object.entries(categoryLabels) as [ComponentCategory, string][];
  readonly title = computed(() => this.category() ? categoryLabels[this.category()!] : 'Componentes');
  readonly brands = computed(() => this.catalog.getBrands(this.category()));
  readonly results = computed(() => this.catalog.query(this.currentFilters(), this.sort()));

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  updateBrand(event: Event): void {
    this.brand.set((event.target as HTMLSelectElement).value);
  }

  updateNumber(target: 'minPrice' | 'maxPrice' | 'minVram' | 'minCapacity' | 'minWattage', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const nextValue = Number.isFinite(value) && value > 0 ? value : undefined;
    this[target].set(nextValue);
  }

  updateSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as CatalogSort);
  }

  toggleComparison(component: CatalogComponent): void {
    this.comparison.toggle(component);
  }

  addToBuilder(component: CatalogComponent): void {
    this.builder.add(component);
  }

  clearFilters(): void {
    this.search.set('');
    this.brand.set('');
    this.minPrice.set(undefined);
    this.maxPrice.set(undefined);
    this.minVram.set(undefined);
    this.minCapacity.set(undefined);
    this.minWattage.set(undefined);
  }

  clearSelection(): void {
    this.comparison.clear();
  }

  isCompared(id: number): boolean {
    return this.comparison.isSelected(id);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  specificationSummary(component: CatalogComponent): string {
    const specs = component.specifications;
    const values = [
      specs.socket,
      specs.coreCount ? `${specs.coreCount} núcleos` : undefined,
      specs.vramGB ? `${specs.vramGB} GB` : undefined,
      specs.capacityGB ? `${specs.capacityGB >= 1000 ? specs.capacityGB / 1000 + ' TB' : specs.capacityGB + ' GB'}` : undefined,
      specs.ramType,
      specs.memorySpeedMHz ? `${specs.memorySpeedMHz} MHz` : undefined,
      specs.formFactor,
      specs.wattage ? `${specs.wattage} W` : undefined,
    ].filter(Boolean);
    return values.slice(0, 3).join(' • ');
  }

  private currentFilters(): CatalogFilters {
    return {
      category: this.category(),
      search: this.search(),
      brand: this.brand(),
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
      minVramGB: this.minVram(),
      minCapacityGB: this.minCapacity(),
      minWattage: this.minWattage(),
    };
  }

  private readCategory(): ComponentCategory | undefined {
    const value = this.route.snapshot.paramMap.get('category');
    return value && value in categoryLabels ? value as ComponentCategory : undefined;
  }
}
