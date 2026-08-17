import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaProdutosComponent } from './lista-produtos';

describe('ListaProdutos', () => {
  let component: ListaProdutosComponent;
  let fixture: ComponentFixture<ListaProdutosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaProdutosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaProdutosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
