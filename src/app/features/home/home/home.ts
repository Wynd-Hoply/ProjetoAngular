import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, PLATFORM_ID, ViewChild, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { gpus } from '../../../core/data/gpus';
import { processors } from '../../../core/data/processors';
import { ram } from '../../../core/data/ram';
import { storage } from '../../../core/data/storage';

interface CategoryShortcut {
  label: string;
  description: string;
  route: string;
  image: string; // Atualizado de icon para image
}

interface BuilderStep {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  @ViewChild('productCarousel') private productCarousel?: ElementRef<HTMLElement>;
  readonly activeSlide = signal(0);

  readonly slides = [
    {
      kind: 'banner' as const,
      eyebrow: 'Monte sem complicação',
      title: 'A configuração certa começa aqui.',
      description: 'Combine suas peças, confira a compatibilidade e monte uma build feita para o seu objetivo.',
      action: 'Começar montagem',
      route: '/build-up',
      accent: 'performance',
    },
    {
      kind: 'product' as const,
      eyebrow: 'Destaque do catálogo',
      title: processors[1].name,
      description: `${processors[1].brand} · Desempenho ${processors[1].performanceScore}/100 para sua build.`,
      action: 'Ver produto',
      route: `/components/${processors[1].category}`,
      accent: 'product',
      product: processors[1],
    },
    {
      kind: 'banner' as const,
      eyebrow: 'Escolha com confiança',
      title: 'Componentes que trabalham juntos.',
      description: 'Encontre processadores, placas de vídeo e muito mais para montar um PC equilibrado.',
      action: 'Explorar componentes',
      route: '/components',
      accent: 'components',
    },
    {
      kind: 'product' as const,
      eyebrow: 'Destaque do catálogo',
      title: gpus[1].name,
      description: `${gpus[1].brand} · Desempenho ${gpus[1].performanceScore}/100 para sua build.`,
      action: 'Ver produto',
      route: `/components/${gpus[1].category}`,
      accent: 'product',
      product: gpus[1],
    },
    {
      kind: 'banner' as const,
      eyebrow: 'Sua próxima build',
      title: 'Mais desempenho para jogar e criar.',
      description: 'Salve sua configuração e continue de onde parou sempre que quiser.',
      action: 'Ver minhas builds',
      route: '/builds',
      accent: 'builds',
    },
    ...[ram[1], storage[1]].map((product) => ({
      kind: 'product' as const,
      eyebrow: 'Destaque do catálogo',
      title: product.name,
      description: `${product.brand} · Desempenho ${product.performanceScore}/100 para sua build.`,
      action: 'Ver produto',
      route: `/components/${product.category}`,
      accent: 'product',
      product,
    })),
  ];

  readonly featuredProducts = [
    processors[0],
    gpus[0],
    ram[1],
    storage[1],
    processors[1],
    gpus[1],
  ];

  readonly categories: CategoryShortcut[] = [
    { label: 'Processadores', description: 'Desempenho para cada tipo de uso.', route: 'cpu', image: '/assets/images/PROCESSADOR/Processador (1).png' },
    { label: 'Placas de vídeo', description: 'Mais frames para jogar e criar.', route: 'gpu', image: '/assets/images/PLACA DE VIDEO/PlacaDeVideo (1).png' },
    { label: 'Placas-mãe', description: 'A base certa para sua configuração.', route: 'motherboard', image: '/assets/images/PLACA MAE/images-removebg-preview.png' },
    { label: 'Memórias', description: 'Agilidade para suas tarefas.', route: 'ram', image: '/assets/images/Ram/images__1_-removebg-preview.png' },
    { label: 'Armazenamento', description: 'Espaço e velocidade para seus arquivos.', route: 'storage', image: '/assets/images/ARM/images__7_-removebg-preview.png' },
    { label: 'Fontes', description: 'Energia confiável para o seu PC.', route: 'psu', image: '/assets/images/FONTE/Fonte (1).png' },
  ];

  readonly steps: BuilderStep[] = [
    { number: '01', title: 'Escolha seus componentes', description: 'Explore o catálogo e encontre peças que combinam com seu objetivo.' },
    { number: '02', title: 'Verifique a compatibilidade', description: 'O sistema confere sockets, memória, formato e potência.' },
    { number: '03', title: 'Monte sua configuração', description: 'Adicione, substitua e organize as peças do seu computador.' },
    { number: '04', title: 'Salve sua build', description: 'Dê um nome à configuração e continue de onde parou.' },
  ];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const timer = window.setInterval(() => {
        this.nextSlide();
      }, 6000);
      this.destroyRef.onDestroy(() => window.clearInterval(timer));
    }
  }

  nextSlide(): void {
    this.activeSlide.update((slide) => (slide + 1) % this.slides.length);
  }

  previousSlide(): void {
    this.activeSlide.update((slide) => (slide - 1 + this.slides.length) % this.slides.length);
  }

  selectSlide(index: number): void {
    this.activeSlide.set(index);
  }

  scrollProducts(direction: 'previous' | 'next'): void {
    const carousel = this.productCarousel?.nativeElement;
    if (!carousel) return;

    const card = carousel.querySelector<HTMLElement>('.product-card');
    const distance = card ? card.offsetWidth + 16 : carousel.clientWidth;
    carousel.scrollBy({
      left: direction === 'next' ? distance : -distance,
      behavior: 'smooth',
    });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  categoryLabel(category: string): string {
    const labels: Record<string, string> = {
      cpu: 'Processador',
      gpu: 'Placa de vídeo',
      ram: 'Memória RAM',
      storage: 'Armazenamento',
    };
    return labels[category] ?? 'Componente';
  }

  productBadge(index: number): string {
    return index % 3 === 0 ? 'Mais vendido' : index % 3 === 1 ? 'Destaque' : 'Custo-benefício';
  }
}