import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ListaProdutos } from './lista-produtos';
import { BuilderService } from '../../../core/services/builder';
import { CatalogService } from '../../../core/services/catalog';
import { ComparisonService } from '../../../core/services/comparison';

describe('ListaProdutos', () => {
  let component: ListaProdutos;
  let fixture: ComponentFixture<ListaProdutos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaProdutos],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({})),
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaProdutos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve adicionar um componente ao construtor compartilhado e navegar para /builder', async () => {
    const router = TestBed.inject(Router);
    const builder = TestBed.inject(BuilderService);
    const catalog = TestBed.inject(CatalogService);
    TestBed.inject(ComparisonService);

    builder.clear();
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const componentToAdd = catalog.getAll().find((item) => item.category === 'cpu');

    expect(componentToAdd).toBeTruthy();
    if (!componentToAdd) {
      return;
    }

    await component.addToBuilder(componentToAdd);

    expect(builder.selected().cpu?.id).toBe(componentToAdd.id);
    expect(builder.total()).toBe(componentToAdd.price);
    expect(navigateSpy).toHaveBeenCalledWith(['/builder']);
  });
});
