import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AuthUser {
  name: string;
  email: string;
  password: string;
}

export interface AuthSession {
  name: string;
  email: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Chaves usadas para salvar usuários e sessão no localStorage.
  private readonly usersKey = 'project-auth-users';
  private readonly sessionKey = 'project-auth-session';
  // PLATFORM_ID + isPlatformBrowser evitam acessar localStorage durante SSR.
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Signal com a lista de usuários cadastrados neste navegador.
  private readonly usersState = signal<AuthUser[]>(this.readUsers());
  // Signal com o usuário logado no momento, se existir.
  readonly currentUser = signal<AuthSession | null>(this.readSession());
  // computed recalcula automaticamente se existe ou não sessão ativa.
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  // computed expõe só o nome para a interface usar em saudação/menus.
  readonly displayName = computed(() => this.currentUser()?.name ?? '');

  // Valida email/senha e, se encontrar um usuário válido, grava a sessão.
  login(email: string, password: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.usersState().find((item) => item.email === normalizedEmail && item.password === password);

    if (!user) {
      return {
        success: false,
        message: 'Email ou senha inválidos.',
      };
    }

    this.setSession({
      name: user.name,
      email: user.email,
    });

    return {
      success: true,
      message: `Bem-vindo, ${user.name}.`,
    };
  }

  // Cria um novo usuário, impede emails repetidos e já inicia a sessão.
  register(name: string, email: string, password: string): AuthResult {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return {
        success: false,
        message: 'Preencha todos os campos.',
      };
    }

    if (this.usersState().some((user) => user.email === normalizedEmail)) {
      return {
        success: false,
        message: 'Já existe uma conta cadastrada com este email.',
      };
    }

    const newUser: AuthUser = {
      name: normalizedName,
      email: normalizedEmail,
      password,
    };

    this.usersState.update((users) => [...users, newUser]);
    this.persistUsers();
    this.setSession({
      name: newUser.name,
      email: newUser.email,
    });

    return {
      success: true,
      message: 'Conta criada com sucesso.',
    };
  }

  // Remove a sessão atual do signal e do localStorage.
  logout(): void {
    this.currentUser.set(null);

    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.sessionKey);
  }

  // Lê os usuários salvos no navegador e trata dados inválidos com segurança.
  private readUsers(): AuthUser[] {
    if (!this.isBrowser) {
      return [];
    }

    const storedUsers = localStorage.getItem(this.usersKey);

    if (!storedUsers) {
      return [];
    }

    try {
      const parsedUsers = JSON.parse(storedUsers) as AuthUser[];
      return Array.isArray(parsedUsers) ? parsedUsers : [];
    } catch {
      return [];
    }
  }

  // Lê a sessão salva para manter o login após recarregar a página.
  private readSession(): AuthSession | null {
    if (!this.isBrowser) {
      return null;
    }

    const storedSession = localStorage.getItem(this.sessionKey);

    if (!storedSession) {
      return null;
    }

    try {
      const parsedSession = JSON.parse(storedSession) as AuthSession;
      if (!parsedSession?.email || !parsedSession?.name) {
        return null;
      }

      return parsedSession;
    } catch {
      return null;
    }
  }

  // Atualiza o signal da sessão e persiste no localStorage quando possível.
  private setSession(session: AuthSession): void {
    this.currentUser.set(session);

    if (!this.isBrowser) {
      return;
  // Salva a lista de usuários no localStorage depois de um cadastro novo.
    }

    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  private persistUsers(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.usersKey, JSON.stringify(this.usersState()));
  }
}