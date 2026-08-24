import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AuthUser {
  username: string;
  name: string;
  email: string;
  password: string;
  bio: string;
  avatar: string | null;
  joinedAt: string;
  isAdmin: boolean;
}

export interface AuthSession {
  username: string;
  name: string;
  email: string;
  bio: string;
  avatar: string | null;
  joinedAt: string;
  isAdmin: boolean;
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

  private readonly usersKey = 'project-auth-users';
  private readonly sessionKey = 'project-auth-session';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly usersState = signal<AuthUser[]>(this.readUsers());

  readonly currentUser = signal<AuthSession | null>(this.readSession());

  readonly isAuthenticated = computed(
    () => this.currentUser() !== null
  );

  readonly displayName = computed(
    () => this.currentUser()?.name ?? ''
  );

  readonly isAdmin = computed(
    () => this.currentUser()?.isAdmin === true
  );

  // =========================
  // LOGIN
  // =========================

  async login(
    identifier: string,
    password: string
  ): Promise<AuthResult> {

    const normalized = identifier.trim().toLowerCase();

    const user = this.usersState().find(
      (item) =>
        item.email.toLowerCase() === normalized ||
        item.username.toLowerCase() === normalized
    );

    if (!user) {
      return {
        success: false,
        message: 'Email/usuário ou senha inválidos.',
      };
    }

    if (user.password !== password) {
      return {
        success: false,
        message: 'Email/usuário ou senha inválidos.',
      };
    }

    this.setSession(this.toSession(user));

    return {
      success: true,
      message: `Bem-vindo, ${user.name}.`,
    };
  }

  // =========================
  // REGISTRO
  // =========================

  async register(
    name: string,
    username: string,
    email: string,
    password: string
  ): Promise<AuthResult> {

    const normalizedName = name.trim();
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedName ||
      !normalizedUsername ||
      !normalizedEmail ||
      !password
    ) {
      return {
        success: false,
        message: 'Preencha todos os campos.',
      };
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      return {
        success: false,
        message:
          'O usuário deve ter de 3 a 20 caracteres (letras, números ou _).',
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: 'A senha precisa ter pelo menos 6 caracteres.',
      };
    }

    if (
      this.usersState().some(
        (user) => user.email === normalizedEmail
      )
    ) {
      return {
        success: false,
        message: 'Já existe uma conta cadastrada com este email.',
      };
    }

    if (
      this.usersState().some(
        (user) =>
          user.username.toLowerCase() ===
          normalizedUsername.toLowerCase()
      )
    ) {
      return {
        success: false,
        message: 'Esse nome de usuário já está em uso.',
      };
    }

    const newUser: AuthUser = {
      username: normalizedUsername,
      name: normalizedName,
      email: normalizedEmail,
      password: password,
      bio: '',
      avatar: null,
      joinedAt: new Date().toISOString(),
      isAdmin: false,
    };

    this.usersState.update((users) => [
      ...users,
      newUser,
    ]);

    this.persistUsers();

    this.setSession(this.toSession(newUser));

    return {
      success: true,
      message: 'Conta criada com sucesso.',
    };
  }

  // =========================
  // LOGOUT
  // =========================

  logout(): void {
    this.currentUser.set(null);

    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.sessionKey);
  }

  // =========================
  // ATUALIZAR PERFIL
  // =========================

  updateProfile(update: {
    name?: string;
    bio?: string;
    avatar?: string | null;
  }): AuthResult {

    const session = this.currentUser();

    if (!session) {
      return {
        success: false,
        message: 'Você precisa estar logado.',
      };
    }

    const nextName = update.name?.trim();

    if (update.name !== undefined && !nextName) {
      return {
        success: false,
        message: 'O nome não pode ficar vazio.',
      };
    }

    this.usersState.update((users) =>
      users.map((user) =>
        user.username === session.username
          ? {
              ...user,
              name: nextName ?? user.name,
              bio:
                update.bio !== undefined
                  ? update.bio.slice(0, 280)
                  : user.bio,
              avatar:
                update.avatar !== undefined
                  ? update.avatar
                  : user.avatar,
            }
          : user
      )
    );

    this.persistUsers();

    const updatedUser = this.usersState().find(
      (user) => user.username === session.username
    );

    if (updatedUser) {
      this.setSession(this.toSession(updatedUser));
    }

    return {
      success: true,
      message: 'Perfil atualizado com sucesso.',
    };
  }

  // =========================
  // ALTERAR SENHA
  // =========================

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> {

    const session = this.currentUser();

    if (!session) {
      return {
        success: false,
        message: 'Você precisa estar logado.',
      };
    }

    const user = this.usersState().find(
      (item) => item.username === session.username
    );

    if (!user) {
      return {
        success: false,
        message: 'Usuário não encontrado.',
      };
    }

    if (user.password !== currentPassword) {
      return {
        success: false,
        message: 'Senha atual incorreta.',
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        message:
          'A nova senha precisa ter pelo menos 6 caracteres.',
      };
    }

    this.usersState.update((users) =>
      users.map((item) =>
        item.username === session.username
          ? {
              ...item,
              password: newPassword,
            }
          : item
      )
    );

    this.persistUsers();

    return {
      success: true,
      message: 'Senha alterada com sucesso.',
    };
  }

  // =========================
  // PERFIL PÚBLICO
  // =========================

  getPublicProfile(
    username: string
  ): PublicProfile | null {

    const normalized = username.trim().toLowerCase();

    const user = this.usersState().find(
      (item) =>
        item.username.toLowerCase() === normalized
    );

    return user ? this.toSession(user) : null;
  }

  // =========================
  // ADMIN
  // =========================

  getUsersForAdmin(): AuthSession[] {
    return this.usersState().map(
      (user) => this.toSession(user)
    );
  }

  removeUserForAdmin(username: string): void {

    this.usersState.update((users) =>
      users.filter(
        (user) => user.username !== username
      )
    );

    this.persistUsers();
  }

  setAdminForAdmin(
    username: string,
    isAdmin: boolean
  ): void {

    this.usersState.update((users) =>
      users.map((user) =>
        user.username === username
          ? {
              ...user,
              isAdmin,
            }
          : user
      )
    );

    this.persistUsers();

    const session = this.currentUser();

    if (session?.username === username) {
      this.setSession({
        ...session,
        isAdmin,
      });
    }
  }

  // =========================
  // CONVERTER USUÁRIO -> SESSÃO
  // =========================

  private toSession(
    user: AuthUser
  ): AuthSession {

    return {
      username: user.username,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      joinedAt: user.joinedAt,
      isAdmin: user.isAdmin,
    };
  }

  // =========================
  // LER USUÁRIOS
  // =========================

  private readUsers(): AuthUser[] {

    if (!this.isBrowser) {
      return [];
    }

    const storedUsers =
      localStorage.getItem(this.usersKey);

    let users: AuthUser[] = [];

    if (storedUsers) {
      try {
        const parsedUsers =
          JSON.parse(storedUsers) as AuthUser[];

        users = Array.isArray(parsedUsers)
          ? parsedUsers.filter(
              (user) => !!user.username
            )
          : [];

      } catch {
        users = [];
      }
    }

    // Cria o ADMIN automaticamente
    // caso ainda não exista.
    if (
      !users.some(
        (user) => user.username === 'admin'
      )
    ) {

      users.push({
        username: 'admin',
        name: 'Administrador',
        email: 'admin@pcraft.local',

        // SENHA DO ADMIN
        password: 'admin123',

        bio: '',
        avatar: null,
        joinedAt: new Date().toISOString(),

        // ADMIN
        isAdmin: true,
      });

      localStorage.setItem(
        this.usersKey,
        JSON.stringify(users)
      );
    }

    return users;
  }

  // =========================
  // LER SESSÃO
  // =========================

  private readSession(): AuthSession | null {

    if (!this.isBrowser) {
      return null;
    }

    const storedSession =
      localStorage.getItem(this.sessionKey);

    if (!storedSession) {
      return null;
    }

    try {

      const parsedSession =
        JSON.parse(storedSession) as AuthSession;

      return parsedSession?.username
        ? parsedSession
        : null;

    } catch {
      return null;
    }
  }

  // =========================
  // SALVAR SESSÃO
  // =========================

  private setSession(
    session: AuthSession
  ): void {

    this.currentUser.set(session);

    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(
      this.sessionKey,
      JSON.stringify(session)
    );
  }

  // =========================
  // SALVAR USUÁRIOS
  // =========================

  private persistUsers(): void {

    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(
      this.usersKey,
      JSON.stringify(this.usersState())
    );
  }
}