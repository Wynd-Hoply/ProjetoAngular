import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AuthUser {
  username: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  bio: string;
  avatar: string | null;
  joinedAt: string;
}

export interface AuthSession {
  username: string;
  name: string;
  email: string;
  bio: string;
  avatar: string | null;
  joinedAt: string;
}

export interface PublicProfile {
  username: string;
  name: string;
  bio: string;
  avatar: string | null;
  joinedAt: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Chaves usadas para salvar usuários e sessão no localStorage.
  private readonly usersKey = 'project-auth-users';
  private readonly sessionKey = 'project-auth-session';
  // PLATFORM_ID + isPlatformBrowser evitam acessar localStorage/crypto durante SSR.
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Signal com a lista de usuários cadastrados neste navegador.
  private readonly usersState = signal<AuthUser[]>(this.readUsers());
  // Signal com o usuário logado no momento, se existir.
  readonly currentUser = signal<AuthSession | null>(this.readSession());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly displayName = computed(() => this.currentUser()?.name ?? '');

  // Login aceita email OU username, como no meupc.net.
  async login(identifier: string, password: string): Promise<AuthResult> {
    const normalized = identifier.trim().toLowerCase();
    const user = this.usersState().find(
      (item) => item.email === normalized || item.username.toLowerCase() === normalized,
    );

    if (!user) {
      return { success: false, message: 'Não encontramos uma conta com esse email/usuário.' };
    }

    const hash = await this.hashPassword(password, user.passwordSalt);
    if (hash !== user.passwordHash) {
      return { success: false, message: 'Email/usuário ou senha inválidos.' };
    }

    this.setSession(this.toSession(user));
    return { success: true, message: `Bem-vindo, ${user.name}.` };
  }

  async register(name: string, username: string, email: string, password: string): Promise<AuthResult> {
    const normalizedName = name.trim();
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedUsername || !normalizedEmail || !password) {
      return { success: false, message: 'Preencha todos os campos.' };
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      return { success: false, message: 'O usuário deve ter de 3 a 20 caracteres (letras, números ou _).' };
    }

    if (password.length < 6) {
      return { success: false, message: 'A senha precisa ter pelo menos 6 caracteres.' };
    }

    if (this.usersState().some((user) => user.email === normalizedEmail)) {
      return { success: false, message: 'Já existe uma conta cadastrada com este email.' };
    }

    if (this.usersState().some((user) => user.username.toLowerCase() === normalizedUsername.toLowerCase())) {
      return { success: false, message: 'Esse nome de usuário já está em uso.' };
    }

    const salt = this.generateSalt();
    const hash = await this.hashPassword(password, salt);

    const newUser: AuthUser = {
      username: normalizedUsername,
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      bio: '',
      avatar: null,
      joinedAt: new Date().toISOString(),
    };

    this.usersState.update((users) => [...users, newUser]);
    this.persistUsers();
    this.setSession(this.toSession(newUser));

    return { success: true, message: 'Conta criada com sucesso.' };
  }

  logout(): void {
    this.currentUser.set(null);

    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.sessionKey);
  }

  // Atualiza nome, bio e/ou avatar do usuário logado.
  updateProfile(update: { name?: string; bio?: string; avatar?: string | null }): AuthResult {
    const session = this.currentUser();
    if (!session) {
      return { success: false, message: 'Você precisa estar logado.' };
    }

    const nextName = update.name?.trim();
    if (update.name !== undefined && !nextName) {
      return { success: false, message: 'O nome não pode ficar vazio.' };
    }

    this.usersState.update((users) => users.map((user) => user.username === session.username
      ? {
          ...user,
          name: nextName ?? user.name,
          bio: update.bio !== undefined ? update.bio.slice(0, 280) : user.bio,
          avatar: update.avatar !== undefined ? update.avatar : user.avatar,
        }
      : user));

    this.persistUsers();

    const updatedUser = this.usersState().find((user) => user.username === session.username);
    if (updatedUser) {
      this.setSession(this.toSession(updatedUser));
    }

    return { success: true, message: 'Perfil atualizado com sucesso.' };
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
    const session = this.currentUser();
    if (!session) {
      return { success: false, message: 'Você precisa estar logado.' };
    }

    const user = this.usersState().find((item) => item.username === session.username);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const currentHash = await this.hashPassword(currentPassword, user.passwordSalt);
    if (currentHash !== user.passwordHash) {
      return { success: false, message: 'Senha atual incorreta.' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'A nova senha precisa ter pelo menos 6 caracteres.' };
    }

    const salt = this.generateSalt();
    const hash = await this.hashPassword(newPassword, salt);

    this.usersState.update((users) => users.map((item) => item.username === session.username
      ? { ...item, passwordHash: hash, passwordSalt: salt }
      : item));
    this.persistUsers();

    return { success: true, message: 'Senha alterada com sucesso.' };
  }

  // Usado pela página de perfil público (/perfil/:username). Nunca expõe hash/salt.
  getPublicProfile(username: string): PublicProfile | null {
    const normalized = username.trim().toLowerCase();
    const user = this.usersState().find((item) => item.username.toLowerCase() === normalized);
    return user ? this.toSession(user) : null;
  }

  getUsersForAdmin(): AuthSession[] {
    return this.usersState().map((user) => this.toSession(user));
  }

  removeUserForAdmin(username: string): void {
    this.usersState.update((users) => users.filter((user) => user.username !== username));
    this.persistUsers();
  }

  private toSession(user: AuthUser): AuthSession {
    return {
      username: user.username,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      joinedAt: user.joinedAt,
    };
  }

  // SHA-256(salt + senha) via Web Crypto. Não é o mesmo nível de um bcrypt/argon2
  // server-side, mas evita guardar a senha em texto puro no localStorage.
  private async hashPassword(password: string, salt: string): Promise<string> {
    if (!this.isBrowser || typeof crypto === 'undefined' || !crypto.subtle) {
      return `${salt}:${password}`;
    }
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private generateSalt(): string {
    if (this.isBrowser && typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return Math.random().toString(36).slice(2);
  }

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
      return Array.isArray(parsedUsers) ? parsedUsers.filter((user) => !!user.username) : [];
    } catch {
      return [];
    }
  }

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
      return parsedSession?.username ? parsedSession : null;
    } catch {
      return null;
    }
  }

  private setSession(session: AuthSession): void {
    this.currentUser.set(session);

    if (!this.isBrowser) {
      return;
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