import { TestBed } from '@angular/core/testing';

import { ComparisonService } from './comparison';
import { CatalogService } from './catalog';
import { Component } from '../models/component.model';

const components: Component[] = [1, 2, 3, 4, 5].map((id) => ({
  id,
  name: `Componente ${id}`,
  category: 'cpu',
  brand: 'Teste',
  price: id * 100,
  performanceScore: id * 10,
  powerDrawWatts: 50,
  image: `${id}.png`,
  specifications: {},
}));

describe('ComparisonService', () => {
  let service: ComparisonService;
  let catalog: { getById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // O catálogo falso controla quais IDs existem sem carregar o catálogo real.
    catalog = {
      getById: vi.fn((id: number) => components.find((component) => component.id === id)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CatalogService, useValue: catalog }],
    });
    service = TestBed.inject(ComparisonService);
  });

  it('adiciona e remove itens ao alternar', () => {
    service.toggle(components[0]);
    expect(service.isSelected(1)).toBe(true);
    expect(service.selected()).toEqual([components[0]]);

    service.toggle(components[0]);
    expect(service.isSelected(1)).toBe(false);
    expect(service.selected()).toEqual([]);
  });

  it('remove um item específico e limpa a comparação', () => {
    service.toggle(components[0]);
    service.toggle(components[1]);
    service.remove(1);

    expect(service.selected()).toEqual([components[1]]);
    service.clear();
    expect(service.selected()).toEqual([]);
  });

  it('indica estados vazio, cheio e não cheio', () => {
    expect(service.isFull()).toBe(false);
    for (const component of components.slice(0, service.maxItems)) {
      service.toggle(component);
    }

    expect(service.isFull()).toBe(true);
    expect(service.isSelected(4)).toBe(true);
    expect(service.isSelected(5)).toBe(false);
    service.toggle(components[4]);
    expect(service.selected()).toHaveLength(service.maxItems);
  });

  it('retorna o item selecionado por id e undefined quando não existe', () => {
    service.toggle(components[1]);

    expect(service.getById(2)).toEqual(components[1]);
    expect(service.getById(999)).toBeUndefined();
  });

  it('remove da seleção itens que o catálogo não consegue resolver', () => {
    service.toggle(components[0]);
    catalog.getById.mockReturnValue(undefined);

    expect(service.selected()).toEqual([]);
    expect(catalog.getById).toHaveBeenCalledWith(1);
  });
});
