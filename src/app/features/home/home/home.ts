import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  readonly categories: CategoryShortcut[] = [
    { label: 'Processadores', description: 'Desempenho para cada tipo de uso.', route: 'cpu', image: 'public/assets/images/PROCESSADOR/Processador (1).png' },
    { label: 'Placas de vídeo', description: 'Mais frames para jogar e criar.', route: 'gpu', image: 'public/assets/images/PLACA DE VIDEO/PlacaDeVideo (1).png' },
    { label: 'Placas-mãe', description: 'A base certa para sua configuração.', route: 'motherboard', image: 'public/assets/images/PLACA MAE/images-removebg-preview.png' },
    { label: 'Memórias', description: 'Agilidade para suas tarefas.', route: 'ram', image: 'public/assets/images/Ram/images__1_-removebg-preview.png' },
    { label: 'Armazenamento', description: 'Espaço e velocidade para seus arquivos.', route: 'storage', image: 'public/assets/images/ARM/images__7_-removebg-preview.png' },
    { label: 'Fontes', description: 'Energia confiável para o seu PC.', route: 'psu', image: 'public/assets/images/FONTE/Fonte (1).png' },
  ];

  readonly steps: BuilderStep[] = [
    { number: '01', title: 'Escolha seus componentes', description: 'Explore o catálogo e encontre peças que combinam com seu objetivo.' },
    { number: '02', title: 'Verifique a compatibilidade', description: 'O sistema confere sockets, memória, formato e potência.' },
    { number: '03', title: 'Monte sua configuração', description: 'Adicione, substitua e organize as peças do seu computador.' },
    { number: '04', title: 'Salve sua build', description: 'Dê um nome à configuração e continue de onde parou.' },
  ];
}