import { test, expect } from '@playwright/test';

test('a página inicial mostra o conteúdo principal do hero', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Projeto Angular/);
  await expect(page.getByRole('heading', { name: /Monte o PC ideal/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Começar montagem/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Explorar componentes/i })).toBeVisible();
});

test('o botão principal leva para o builder', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: /Começar montagem/i }).click();

  await expect(page).toHaveURL(/\/builder$/);
  await expect(page.getByRole('main')).toBeVisible();
});

test('o logo retorna o usuário para a página inicial', async ({ page }) => {
  await page.goto('/components');

  await page.getByRole('button', { name: /Ir para a página inicial/i }).click();

  await expect(page).toHaveURL(/\/(home)?$/);
  await expect(page.getByRole('heading', { name: /Monte o PC ideal/i })).toBeVisible();
});

