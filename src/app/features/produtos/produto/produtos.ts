import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog';
import { BuilderService } from '../../../core/services/builder';
import { Component as CatalogComponent } from '../../../core/models/component.model';

@Component({
  selector: 'app-produto',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './produtos.html',
  styleUrl: './produtos.css'
})
export class Produto {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalog = inject(CatalogService);
  private builder = inject(BuilderService);

  productId = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  product = computed(() => this.catalog.getById(this.productId()));

  stores = [
    { name: 'Pichau', freight: '—', discount: '12x R$ 53,92', pixDiscount: 'PIX 10%' },
    { name: 'Terabyte', freight: '—', discount: '10x R$ 65,90', pixDiscount: 'PIX 10%' }
  ];

  formatPrice(p: number) { return p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  addToBuilder(c: CatalogComponent) { this.builder.add(c); this.router.navigate(['/builder']); }
}