import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ListaProdutos } from '../../../features/produtos/lista-produtos/lista-produtos';

describe('Produtos', () => {
  let component: ListaProdutos;
  let fixture: ComponentFixture<ListaProdutos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaProdutos],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaProdutos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});