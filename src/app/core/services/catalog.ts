import { Injectable } from '@angular/core';

import { cases } from '../data/cases';
import { coolers } from '../data/coolers';
import { gpus } from '../data/gpus';
import { motherboards } from '../data/motherboards';
import { processors } from '../data/processors';
import { psus } from '../data/psus';
import { ram } from '../data/ram';
import { storage } from '../data/storage';
import { CatalogFilters, CatalogSort } from '../models/catalog.model';
import { Component, ComponentCategory } from '../models/component.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly components: Component[] = [
    ...processors,
    ...gpus,
    ...motherboards,
    ...ram,
    ...storage,
    ...psus,
    ...cases,
    ...coolers,
  ];

  getAll(): Component[] {
    return [...this.components];
  }

  getByCategory(category: ComponentCategory): Component[] {
    return this.components.filter((component) => component.category === category);
  }

  getById(id: number): Component | undefined {
    return this.components.find((component) => component.id === id);
  }

  query(filters: CatalogFilters = {}, sort: CatalogSort = 'name-asc'): Component[] {
    const filteredComponents = this.components.filter((component) => this.matchesFilters(component, filters));
    return this.sort(filteredComponents, sort);
  }

  getBrands(category?: ComponentCategory): string[] {
    const components = category ? this.getByCategory(category) : this.components;
    return [...new Set(components.map((component) => component.brand))].sort((first, second) => first.localeCompare(second));
  }

  private matchesFilters(component: Component, filters: CatalogFilters): boolean {
    const specifications = component.specifications;
    const normalizedSearch = filters.search?.trim().toLocaleLowerCase('pt-BR');
    const searchableText = [
      component.name,
      component.brand,
      component.category,
      specifications.socket,
      specifications.chipset,
      specifications.memoryType,
      specifications.interface,
      specifications.ramType,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('pt-BR');

    return (
      (!filters.category || component.category === filters.category) &&
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (!filters.brand || component.brand === filters.brand) &&
      (filters.minPrice === undefined || component.price >= filters.minPrice) &&
      (filters.maxPrice === undefined || component.price <= filters.maxPrice) &&
      (filters.minPerformance === undefined || component.performanceScore >= filters.minPerformance) &&
      (!filters.socket || specifications.socket === filters.socket || specifications.supportedSockets?.includes(filters.socket) === true) &&
      (!filters.memoryType || specifications.memoryType === filters.memoryType || specifications.ramType === filters.memoryType) &&
      (!filters.interface || specifications.interface === filters.interface) &&
      (filters.minCapacityGB === undefined || (specifications.capacityGB ?? 0) >= filters.minCapacityGB) &&
      (filters.minVramGB === undefined || (specifications.vramGB ?? 0) >= filters.minVramGB) &&
      (filters.minWattage === undefined || (specifications.wattage ?? 0) >= filters.minWattage)
    );
  }

  private sort(components: Component[], sort: CatalogSort): Component[] {
    return [...components].sort((first, second) => {
      switch (sort) {
        case 'name-desc':
          return second.name.localeCompare(first.name, 'pt-BR');
        case 'price-asc':
          return first.price - second.price;
        case 'price-desc':
          return second.price - first.price;
        case 'performance-desc':
          return second.performanceScore - first.performanceScore;
        case 'name-asc':
        default:
          return first.name.localeCompare(second.name, 'pt-BR');
      }
    });
  }
}
