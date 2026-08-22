import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth';
import { BuildService } from '../../core/services/build';

@Component({
  selector: 'app-builds-comunidade',
  imports: [RouterLink],
  templateUrl: './builds-comunidade.html',
  styleUrl: './builds-comunidade.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildsComunidade {
  private readonly auth = inject(AuthService);
  readonly buildService = inject(BuildService);

  authorOf(username: string) {
    return this.auth.getPublicProfile(username);
  }

  authorInitial(username: string): string {
    return (this.authorOf(username)?.name ?? username).trim().charAt(0).toUpperCase() || '?';
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', { dateStyle: 'medium' });
  }
}