import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme';
import { CarrinhoService } from '../../../core/services/carrinho.service';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  // Controla o estado de tema (claro/escuro) usado no topo da aplicacao.
  themeService = inject(ThemeService);
 
  // Controla o estado do carrinho de compras, usado no topo da aplicacao.
  private carrinhoService = inject(CarrinhoService);
  quantidade = this.carrinhoService.quantidade;
}
