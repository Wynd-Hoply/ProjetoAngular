import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { AuthService } from './auth';
import { BuildService } from './build';

export interface AdminResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly sessionKey = 'pc-builder-admin-session';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly auth = inject(AuthService);
  private readonly buildService = inject(BuildService);

  readonly isAuthenticated = signal(this.readSession());
  readonly users = computed(() => this.auth.getUsersForAdmin());
  readonly builds = computed(() => this.buildService.getAllForAdmin());

  async login(username: string, password: string): Promise<AdminResult> {
    if (username.trim().toLowerCase() !== 'admin' || password !== 'admin123') {
      return { success: false, message: 'Credenciais administrativas inválidas.' };
    }

    this.isAuthenticated.set(true);
    if (this.isBrowser) {
      localStorage.setItem(this.sessionKey, 'true');
    }
    return { success: true, message: 'Acesso administrativo autorizado.' };
  }

  logout(): void {
    this.isAuthenticated.set(false);
    if (this.isBrowser) {
      localStorage.removeItem(this.sessionKey);
    }
  }

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

  private readSession(): boolean {
    return this.isBrowser && localStorage.getItem(this.sessionKey) === 'true';
  }
}
