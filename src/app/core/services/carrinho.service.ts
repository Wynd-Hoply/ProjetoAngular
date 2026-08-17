import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CarrinhoService {
  // Estado central do carrinho; qualquer componente pode reagir a mudancas via signal.
  private carrinho = signal<{ nome: string; preco: number }[]>([]);

  // Exposicao somente leitura da lista atual de itens.
  itens = computed(() => this.carrinho());
  // Quantidade total de itens para badge/contador da interface.
  quantidade = computed(() => this.carrinho().length);
  // Soma do valor total para resumo/checkout.
  total = computed(() => this.carrinho().reduce((total, item) => total + item.preco, 0));

  // Adiciona um novo item preservando imutabilidade da lista.
  adicionar(produto: { nome: string; preco: number }) {
    this.carrinho.update((lista) => [...lista, produto]);
  }

  // Limpa completamente o carrinho.
  limpar() {
    this.carrinho.set([]);
  }
}
