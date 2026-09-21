import { TestBed } from '@angular/core/testing';

import { BuilderService } from './builder';
import { CatalogService } from './catalog';
import { CompatibilityService } from './compatibility';

describe('CompatibilityService', () => {
  let builder: BuilderService;
  let catalog: CatalogService;
  let service: CompatibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    builder = TestBed.inject(BuilderService);
    catalog = TestBed.inject(CatalogService);
    service = TestBed.inject(CompatibilityService);
    builder.clear();
  });

  it('deve aprovar dados correspondentes de CPU, placa-mãe e RAM', () => {
    builder.add(catalog.getById(101)!);
    builder.add(catalog.getById(301)!);
    builder.add(catalog.getById(402)!);

    expect(service.checks().find((check) => check.key === 'cpu-motherboard')?.status).toBe('compatible');
    expect(service.checks().find((check) => check.key === 'ram-motherboard')?.status).toBe('compatible');
  });

  it('deve explicar uma incompatibilidade de socket', () => {
    builder.add(catalog.getById(103)!);
    builder.add(catalog.getById(301)!);

    const check = service.checks().find((item) => item.key === 'cpu-motherboard');
    expect(check?.status).toBe('incompatible');
    expect(check?.message).toContain('LGA1700');
    expect(check?.message).toContain('AM5');
  });

  it('deve suportar plataformas mais antigas com socket e DDR4', () => {
    builder.add(catalog.getById(111)!);
    builder.add(catalog.getById(310)!);
    builder.add(catalog.getById(410)!);
    builder.add(catalog.getById(810)!);

    expect(service.checks().find((check) => check.key === 'cpu-motherboard')?.status).toBe('compatible');
    expect(service.checks().find((check) => check.key === 'ram-motherboard')?.status).toBe('compatible');
    expect(service.checks().find((check) => check.key === 'cpu-cooler')?.status).toBe('compatible');
  });

  it('deve calcular o consumo com uma margem de recomendação de 20 por cento', () => {
    builder.add(catalog.getById(101)!);
    builder.add(catalog.getById(201)!);
    builder.add(catalog.getById(402)!);

    expect(service.estimatedConsumption()).toBe(190);
    expect(service.recommendedWattage()).toBe(228);

    builder.add(catalog.getById(602)!);
    expect(service.checks().find((check) => check.key === 'power-supply')?.status).toBe('compatible');
  });
});
