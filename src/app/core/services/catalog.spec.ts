import { TestBed } from '@angular/core/testing';

import { CatalogService } from './catalog';

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogService);
  });

  it('should aggregate all mocked component categories', () => {
    expect(service.getAll()).toHaveLength(200);
    expect(service.getByCategory('cpu')).toHaveLength(25);
    expect(service.getByCategory('gpu')).toHaveLength(25);
  });

  it('should filter components by search and price', () => {
    const result = service.query({ search: 'Ryzen 5 7600', maxPrice: 1_500 });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('AMD Ryzen 5 7600');
  });

  it('should sort components by price and performance', () => {
    const cheapest = service.query({ category: 'storage' }, 'price-asc');
    const bestProcessor = service.query({ category: 'cpu' }, 'performance-desc');

    expect(cheapest[0].price).toBe(219.9);
    expect(bestProcessor[0].name).toBe('AMD Ryzen 9 7950X3D');
  });
});
