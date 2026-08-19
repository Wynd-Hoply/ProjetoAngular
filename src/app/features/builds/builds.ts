import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { BuildService } from '../../core/services/build';

@Component({
  selector: 'app-builds',
  imports: [RouterLink],
  templateUrl: './builds.html',
  styleUrl: './builds.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Builds {
  readonly builds = inject(BuildService);
  private readonly router = inject(Router);

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', { dateStyle: 'medium' });
  }

  componentCount(build: { components: object }): number {
    return Object.keys(build.components).length;
  }

  openBuild(id: string): void {
    if (this.builds.open(id)) {
      void this.router.navigate(['/builder']);
    }
  }

  removeBuild(id: string): void {
    this.builds.remove(id);
  }
}