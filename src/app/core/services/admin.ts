import { computed, inject, Injectable } from '@angular/core';

import { AuthService } from './auth';
import { BuildService } from './build';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly auth = inject(AuthService);
  private readonly buildService = inject(BuildService);

  // Acesso ao painel = estar logado (login normal) E a conta ter isAdmin.
  readonly isAuthenticated = computed(() => this.auth.isAdmin());
  readonly users = computed(() => this.auth.getUsersForAdmin());
  readonly builds = computed(() => this.buildService.getAllForAdmin());

  removeUser(username: string): void {
    this.auth.removeUserForAdmin(username);
    for (const build of this.builds()) {
      if (build.owner === username) {
        this.buildService.removeForAdmin(build.id);
      }
    }
  }

  removeBuild(id: string): void {
    this.buildService.removeForAdmin(id);
  }

  // Concede/revoga acesso admin a outra conta.
  setAdmin(username: string, isAdmin: boolean): void {
    this.auth.setAdminForAdmin(username, isAdmin);
  }

  // Não existe mais sessão administrativa separada: sair do painel é sair da conta.
  logout(): void {
    this.auth.logout();
  }
}