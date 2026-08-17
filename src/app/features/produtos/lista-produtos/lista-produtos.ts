import { Component, inject } from '@angular/core';
import { CarrinhoService } from '../../../core/services/carrinho.service';
@Component({
  selector: 'app-lista-produtos',
  imports: [],
  templateUrl: './lista-produtos.html',
  styleUrl: './lista-produtos.css',
})
// Componente de vitrine/listagem de produtos disponiveis.
export class ListaProdutos {
  // Permite acessar o estado e as acoes do carrinho diretamente na tela de listagem.
  carrinhoService = inject(CarrinhoService);

  // Propriedades que refletem o estado do carrinho, para exibir na tela de listagem.
  quantidadeCarrinho = this.carrinhoService.quantidade;
  totalCarrinho = this.carrinhoService.total;
}
