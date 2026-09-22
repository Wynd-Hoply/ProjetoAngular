import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { render, screen, fireEvent } from '@testing-library/angular';
import '@testing-library/jest-dom';
import { of } from 'rxjs';

import { Component } from '../../core/models/component.model';
import { SavedBuild } from '../../core/models/saved-build.model';
import { AuthService } from '../../core/services/auth';
import { BuilderService } from '../../core/services/builder';
import { BuildService } from '../../core/services/build';
import { CatalogService } from '../../core/services/catalog';
import { BuildShare } from './build-share';

const processor: Component = {
  id: 1,
  name: 'Processador compartilhado',
  category: 'cpu',
  brand: 'Marca teste',
  price: 1299.9,
  performanceScore: 90,
  powerDrawWatts: 65,
  image: '/assets/images/processador.jpg',
  specifications: {
    socket: 'AM5',
  },
};

const sharedBuild: SavedBuild = {
  id: 'build-1',
  owner: 'autor',
  shareId: 'ABC123',
  isPublic: true,
  name: 'Build compartilhada',
  date: '2026-01-15T00:00:00.000Z',
  components: {
    cpu: processor.id,
  },
  total: processor.price,
};

async function renderBuildShare(build: SavedBuild | null = sharedBuild) {
  const load = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));
  const buildServiceMock = {
    getByShareId: vi.fn(() => build),
    buildLink: vi.fn((shareId: string) => `https://pcraft.test/build/${shareId}`),
    setPublic: vi.fn(),
  };

  const rendered = await render(BuildShare, {
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({ shareId: build?.shareId ?? 'inexistente' }),
          },
          paramMap: of(convertToParamMap({ shareId: build?.shareId ?? 'inexistente' })),
        },
      },
      {
        provide: Router,
        useValue: {
          createUrlTree: vi.fn(() => ({})),
          serializeUrl: vi.fn(() => '/'),
          navigate,
        },
      },
      {
        provide: AuthService,
        useValue: {
          currentUser: signal(null),
          getPublicProfile: vi.fn(() => ({
            username: 'autor',
            name: 'Pessoa autora',
            bio: 'Perfil de teste',
            avatar: null,
            joinedAt: '2025-01-01T00:00:00.000Z',
          })),
        },
      },
      {
        provide: BuildService,
        useValue: buildServiceMock,
      },
      {
        provide: BuilderService,
        useValue: { load },
      },
      {
        provide: CatalogService,
        useValue: {
          getById: vi.fn((id: number) => (id === processor.id ? processor : undefined)),
        },
      },
    ],
  });

  return { ...rendered, load, navigate };
}

describe('BuildShareComponent', () => {
  it('deve mostrar uma mensagem quando a build compartilhada não existe', async () => {
    await renderBuildShare(null);

    expect(screen.getByRole('heading', { name: 'Build não encontrada' })).toBeVisible();
    expect(
      screen.getByText('O link pode estar errado ou a build foi removida pelo dono.'),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toBeVisible();
  });

  it('deve mostrar os dados, o autor e os componentes da build', async () => {
    await renderBuildShare();

    expect(screen.getByRole('heading', { name: 'Build compartilhada' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'por Pessoa autora' })).toBeVisible();
    expect(screen.getByText(/Salva em/)).toBeVisible();
    expect(screen.getAllByText('R$ 1.299,90')).toHaveLength(2);
    expect(screen.getByText('Processador')).toBeVisible();
    expect(screen.getByText('Processador compartilhado')).toBeVisible();
    expect(screen.getByText('Visível em Builds da comunidade')).toBeVisible();
    expect(screen.getByText('Faltando: 7 componente(s) não incluído(s) nesta build.')).toBeVisible();
  });

  it('deve mostrar confirmação quando copia o link da build', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await renderBuildShare();
    await fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));

    expect(writeText).toHaveBeenCalledWith('https://pcraft.test/build/ABC123');
    expect(await screen.findByText('Link copiado!')).toBeVisible();
  });

  it('deve mostrar o link quando ocorre um erro ao copiar', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard indisponível'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await renderBuildShare();
    await fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));

    expect(await screen.findByText('https://pcraft.test/build/ABC123')).toBeVisible();
  });

  it('deve carregar a build no montador quando clica em usar esta build', async () => {
    const { load, navigate } = await renderBuildShare();

    await fireEvent.click(screen.getByRole('button', { name: 'Usar esta build' }));

    expect(load).toHaveBeenCalledWith(sharedBuild.components);
    expect(navigate).toHaveBeenCalledWith(['/builder']);
  });
});
