import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CategoryShortcut {
  label: string;
  description: string;
  route: string;
  icon: string;
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
  readonly categories: CategoryShortcut[] = [
    { label: 'Processadores', description: 'Desempenho para cada tipo de uso.', route: 'cpu', icon: '<img src="assets/images/LogoWM.png" alt="Logo WM" />' },
    { label: 'Placas de vídeo', description: 'Mais frames para jogar e criar.', route: 'gpu', icon: 'GPU' },
    { label: 'Placas-mãe', description: 'A base certa para sua configuração.', route: 'motherboard', icon: 'MB' },
    { label: 'Memórias', description: 'Agilidade para suas tarefas.', route: 'ram', icon: 'RAM' },
    { label: 'Armazenamento', description: 'Espaço e velocidade para seus arquivos.', route: 'storage', icon: 'SSD' },
    { label: 'Fontes', description: 'Energia confiável para o seu PC.', route: 'psu', icon: 'PSU' },
  ];

  readonly steps: BuilderStep[] = [
    { number: '01', title: 'Escolha seus componentes', description: 'Explore o catálogo e encontre peças que combinam com seu objetivo.' },
    { number: '02', title: 'Verifique a compatibilidade', description: 'O sistema confere sockets, memória, formato e potência.' },
    { number: '03', title: 'Monte sua configuração', description: 'Adicione, substitua e organize as peças do seu computador.' },
    { number: '04', title: 'Salve sua build', description: 'Dê um nome à configuração e continue de onde parou.' },
  ];
}
