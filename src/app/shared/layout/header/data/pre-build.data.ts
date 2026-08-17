import { PreBuildPC } from '../models/pre-build.model';

export const PRE_BUILDS_DATA: PreBuildPC[] = [
  {
    id: 'pc-01',
    titulo: 'PC Gamer Home & Office',
    categoria: 'Entrada',
    descricao: 'Excelente para estudo, trabalho e jogos leves com vídeo integrado.',
    precoTotal: 1850.00,
    imagemUrl: '/assets/images/pc-entrada1.webp',
    especificacoes: {
      processador: 'AMD Ryzen 5 4600G (6 cores / 12 threads)',
      placaMae: 'Placa-Mãe B450M Chipset AMD',
      ram: '16GB (2x8GB) DDR4 3200MHz',
      armazenamento: 'SSD 512GB NVMe M.2',
      fonte: 'Fonte 500W 80 Plus Bronze',
      gabinete: 'Gabinete Mid Tower Mesh com Fan RGB'
    }
  },
  {
    id: 'pc-02',
    titulo: 'PC Gamer Fighter 1080p',
    categoria: 'Entrada',
    descricao: 'Projetado para rodar os principais eSports em alta taxa de FPS.',
    precoTotal: 3400.00,
    imagemUrl: '/assets/images/pc-entrada2.webp',
    especificacoes: {
      processador: 'AMD Ryzen 5 5600',
      placaMae: 'Placa-Mãe B550M DDR4',
      ram: '16GB (2x8GB) DDR4 3200MHz',
      gpu: 'AMD Radeon RX 6600 8GB',
      armazenamento: 'SSD 1TB NVMe M.2',
      fonte: 'Fonte 650W 80 Plus Bronze',
      gabinete: 'Gabinete Gamer Vidro Temperado'
    }
  },
  {
    id: 'pc-03',
    titulo: 'PC Gamer Streamer AMD',
    categoria: 'Intermediário',
    descricao: 'Equilíbrio perfeito para jogar em 1440p e realizar transmissões ao vivo.',
    precoTotal: 5800.00,
    imagemUrl: '/assets/images/pc-inter.webp',
    especificacoes: {
      processador: 'AMD Ryzen 5 7600 (AM5)',
      placaMae: 'Placa-Mãe B650M DDR5',
      ram: '32GB (2x16GB) DDR5 6000MHz',
      gpu: 'NVIDIA GeForce RTX 4060 Ti 8GB',
      armazenamento: 'SSD 1TB M.2 NVMe Gen4',
      fonte: 'Fonte 750W 80 Plus Gold Modular',
      gabinete: 'Gabinete Aquário com 3x Fans ARGB',
      cooler: 'Air Cooler DeepCool AG400'
    }
  },
  {
    id: 'pc-04',
    titulo: 'PC Gamer Ultra 4K',
    categoria: 'Avançado',
    descricao: 'Desempenho extremo para encarar lançamentos pesados no Ultra.',
    precoTotal: 9500.00,
    imagemUrl: '/assets/images/pc-avancado.webp',
    especificacoes: {
      processador: 'AMD Ryzen 7 7700X',
      placaMae: 'Placa-Mãe B650 ATX com Wi-Fi',
      ram: '32GB (2x16GB) DDR5 6000MHz',
      gpu: 'NVIDIA GeForce RTX 4070 Ti Super 16GB',
      armazenamento: 'SSD 2TB NVMe M.2',
      fonte: 'Fonte 850W 80 Plus Gold',
      gabinete: 'Gabinete Full Tower Premium Glass',
      cooler: 'Water Cooler 240mm ARGB'
    }
  }
];