import { test, expect } from '@playwright/test';

/**
 * Teste E2E do fluxo de autenticação do noss projeto.
 *
 * Cobre: login (diálogo modal aberto pelo header), login com credenciais
 * inválidas, registro de novo usuário (com login automático) e logout.
 *
 * Cada teste do Playwright roda em um contexto de navegador isolado, então
 * o localStorage começa vazio a cada execução. Isso faz o AuthService
 * recriar automaticamente o usuário admin/admin123 (ver auth.ts),
 * garantindo credenciais previsíveis sem precisar de backend.
 */
test.describe('Autenticação (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('login com credenciais válidas (admin) autentica o usuário', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar' }).first().click();

    const dialog = page.getByRole('dialog', { name: 'Entrar no PCraft' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Email ou nome de usuário').fill('admin');
    await dialog.getByLabel('Senha').fill('admin123');
    await dialog.getByRole('button', { name: 'Entrar' }).click({ force: true });

    await expect(dialog).toBeHidden();
    await expect(page.locator('.auth-profile-chip')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });

  test('login com credenciais inválidas exibe mensagem de erro', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar' }).first().click();

    const dialog = page.getByRole('dialog', { name: 'Entrar no PCraft' });
    await dialog.getByLabel('Email ou nome de usuário').fill('usuario_inexistente');
    await dialog.getByLabel('Senha').fill('senhaerrada');
    await dialog.getByRole('button', { name: 'Entrar' }).click({ force: true });

    await expect(dialog.locator('.auth-feedback--error')).toContainText(
      'Email/usuário ou senha inválidos.'
    );
    await expect(dialog).toBeVisible();
  });

  test('registro de novo usuário autentica automaticamente', async ({ page }) => {
    const username = `e2euser${Date.now()}`;

    await page.goto('/auth/register');

    await page.locator('[formcontrolname="name"]').fill('Usuário E2E');
    await page.locator('[formcontrolname="username"]').fill(username);
    await page.locator('[formcontrolname="email"]').fill(`${username}@example.com`);
    await page.locator('[formcontrolname="password"]').fill('senha123');
    await page.locator('[formcontrolname="confirmPassword"]').fill('senha123');

    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.locator('.auth-profile-chip')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });

  test('registro com senhas diferentes exibe erro de validação', async ({ page }) => {
    const username = `diff${Date.now()}`;

    await page.goto('/auth/register');

    await page.locator('[formcontrolname="name"]').fill('Usuário Divergente');
    await page.locator('[formcontrolname="username"]').fill(username);
    await page.locator('[formcontrolname="email"]').fill(`${username}@example.com`);
    await page.locator('[formcontrolname="password"]').fill('senha123');
    await page.locator('[formcontrolname="confirmPassword"]').fill('senha456');

    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.locator('.auth-feedback--error')).toContainText(
      'As senhas informadas precisam ser iguais.'
    );
    await expect(page).not.toHaveURL('/');
  });

  test('logout encerra a sessão do usuário', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Entrar no PCraft' });
    await dialog.getByLabel('Email ou nome de usuário').fill('admin');
    await dialog.getByLabel('Senha').fill('admin123');
    await dialog.getByRole('button', { name: 'Entrar' }).click({ force: true });
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Sair' }).click();

    await expect(page.getByRole('button', { name: 'Entrar' }).first()).toBeVisible();
  });
});

  
