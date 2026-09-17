import { computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { render, screen, fireEvent } from '@testing-library/angular';
import '@testing-library/jest-dom';
import { of } from 'rxjs';

import { BuilderService } from '../../core/services/builder';
import { BuildService } from '../../core/services/build';
import { CompatibilityService } from '../../core/services/compatibility';
import { Component } from '../../core/models/component.model';
import { SavedBuild } from '../../core/models/saved-build.model';
import { BuildUp } from './build-up';

const component: Component = {
  id: 1,
  name: 'Processador de teste',
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

const savedBuild: SavedBuild = {
  id: 'build-1',
  owner: 'usuario',
  shareId: 'ABC123',
  isPublic: false,
  name: 'Minha build',
  date: '2026-01-01T00:00:00.000Z',
  components: {
    cpu: component.id,
  },
  total: component.price,
};

async function renderBuildUp(withSelectedComponent = false) {
  const selectedState = signal(
    withSelectedComponent
      ? { cpu: component }
      : {},
  );

  const builderMock = {
    selected: computed(() => selectedState()),
    selectedComponents: computed(() => Object.values(selectedState())),
    total: computed(() =>
      Object.values(selectedState()).reduce((total, selected) => total + selected.price, 0),
    ),
    remove: vi.fn((category: 'cpu') => {
      selectedState.update((current) => {
        const next = { ...current };
        delete next[category];
        return next;
      });
    }),
    clear: vi.fn(() => selectedState.set({})),
  };

  const buildsMock = {
    activeBuildId: signal<string | null>(null),
    activeBuild: signal<SavedBuild | null>(null),
    save: vi.fn((name: string) => withSelectedComponent
      ? {
          ...savedBuild,
          name,
        }
      : null),
    buildLink: vi.fn((shareId: string) => `https://pcraft.test/build/${shareId}`),
    clearActive: vi.fn(),
    setPublic: vi.fn(),
  };

  const compatibilityMock = {
    estimatedConsumption: signal(withSelectedComponent ? component.powerDrawWatts : 0),
    recommendedWattage: signal(withSelectedComponent ? 78 : 0),
    checks: signal(
      withSelectedComponent
        ? [
            {
              key: 'cpu-motherboard',
              label: 'CPU e placa-mãe',
              status: 'compatible' as const,
              message: 'Socket AM5 compatível.',
            },
          ]
        : [],
    ),
  };

  return render(BuildUp, {
    providers: [
      { provide: BuilderService, useValue: builderMock },
      { provide: BuildService, useValue: buildsMock },
      { provide: CompatibilityService, useValue: compatibilityMock },
      {
        provide: Router,
        useValue: {
          createUrlTree: vi.fn(() => ({})),
          serializeUrl: vi.fn(() => '/'),
          navigateByUrl: vi.fn(() => Promise.resolve(true)),
          events: of(),
        },
      },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {},
          parent: null,
          params: of({}),
          queryParams: of({}),
        },
      },
    ],
  });
}

describe('BuildUpComponent', () => {
  it('deve mostrar a montagem vazia quando a tela é aberta', async () => {
    await renderBuildUp();

    expect(
      screen.getByRole('heading', { name: 'Montagem do computador' }),
    ).toBeVisible();

    expect(screen.getByLabelText('Nome da build')).toHaveValue('Minha configuração');
    expect(screen.getByText('Sua configuração está vazia')).toBeVisible();
    expect(
      screen.getByText('Selecione componentes ao lado ou adicione peças pelo catálogo.'),
    ).toBeVisible();

    expect(screen.getByRole('heading', { name: 'Categorias ainda vazias' })).toBeVisible();
    expect(
      screen.getByText(
        'Processador, Placa de vídeo, Placa-mãe, Memória RAM, Armazenamento, Fonte, Gabinete, Cooler',
      ),
    ).toBeVisible();

    expect(
      screen.getByText('Selecione os componentes relacionados para verificar a compatibilidade.'),
    ).toBeVisible();

    expect(screen.getByRole('button', { name: 'Gerar permalink' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar por email' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Limpar montagem' })).toBeDisabled();
  });

  it('deve mostrar a mensagem de validação quando tenta salvar sem componentes', async () => {
    await renderBuildUp();

    await fireEvent.click(screen.getByRole('button', { name: 'Salvar build' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Adicione componentes e informe um nome para salvar.',
    );
  });

  it('deve salvar a build e mostrar o permalink quando há um componente selecionado', async () => {
    await renderBuildUp(true);

    const nameInput = screen.getByLabelText('Nome da build');
    await fireEvent.input(nameInput, {
      target: { value: 'Build silenciosa' },
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Salvar build' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Build "Build silenciosa" salva com sucesso.',
    );
    expect(screen.getByLabelText('Link da build')).toHaveValue(
      'https://pcraft.test/build/ABC123',
    );
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeVisible();
  });

  it('deve gerar o permalink ao clicar no botão correspondente', async () => {
    await renderBuildUp(true);

    await fireEvent.click(screen.getByRole('button', { name: 'Gerar permalink' }));

    expect(screen.getByLabelText('Link da build')).toHaveValue(
      'https://pcraft.test/build/ABC123',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Build "Minha configuração" salva com sucesso.',
    );
  });

  it('deve mostrar confirmação quando copia o link da build', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await renderBuildUp(true);
    await fireEvent.click(screen.getByRole('button', { name: 'Salvar build' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));

    expect(writeText).toHaveBeenCalledWith('https://pcraft.test/build/ABC123');
    expect(await screen.findByText('Link copiado!')).toBeVisible();
  });

  it('deve compartilhar a build usando a Web Share API quando disponível', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    });

    await renderBuildUp(true);
    await fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));

    expect(share).toHaveBeenCalledWith({
      title: 'Minha configuração',
      text: 'Confira minha build no PCraft',
      url: 'https://pcraft.test/build/ABC123',
    });
  });

  it('deve mostrar o componente selecionado e a validação de compatibilidade', async () => {
    await renderBuildUp(true);

    expect(screen.getByText('Processador de teste')).toBeVisible();
    expect(screen.getAllByText('R$ 1.299,90')).toHaveLength(3);
    expect(screen.getByText('Total estimado')).toBeVisible();
    expect(screen.getByText(/Compatível/)).toBeVisible();
    expect(screen.getByText('Socket AM5 compatível.')).toBeVisible();

    expect(
      screen.getByRole('button', { name: 'Remover Processador de teste' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Gerar permalink' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Enviar por email' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Limpar montagem' })).toBeEnabled();
  });

  it('deve remover o componente e mostrar novamente a configuração vazia', async () => {
    await renderBuildUp(true);

    await fireEvent.click(
      screen.getByRole('button', { name: 'Remover Processador de teste' }),
    );

    expect(screen.getByText('Sua configuração está vazia')).toBeVisible();
    expect(screen.queryByText('Processador de teste')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar permalink' })).toBeDisabled();
  });

  it('deve limpar todos os componentes quando clica em limpar montagem', async () => {
    await renderBuildUp(true);

    await fireEvent.click(screen.getByRole('button', { name: 'Limpar montagem' }));

    expect(screen.getByText('Sua configuração está vazia')).toBeVisible();
    expect(screen.queryByText('Processador de teste')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar montagem' })).toBeDisabled();
  });

  it('deve restaurar o nome e esconder o permalink ao iniciar uma nova build', async () => {
    await renderBuildUp(true);

    await fireEvent.input(screen.getByLabelText('Nome da build'), {
      target: { value: 'Build para reiniciar' },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Salvar build' }));
    expect(screen.getByLabelText('Link da build')).toBeVisible();

    await fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova build' }));

    expect(screen.getByLabelText('Nome da build')).toHaveValue('Minha configuração');
    expect(screen.getByText('Sua configuração está vazia')).toBeVisible();
    expect(screen.queryByLabelText('Link da build')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});