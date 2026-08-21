import { Component } from '../models/component.model';

const componentImage = 'assets/images/LogoWM.png';

export const processors: Component[] = [
  {
    id: 101,
    name: 'AMD Ryzen 5 7600',
    category: 'cpu',
    brand: 'AMD',
    price: 1_249.9,
    performanceScore: 78,
    powerDrawWatts: 65,
    image: '/assets/images/Processadores/101.jpg',
    specifications: { socket: 'AM5', coreCount: 6, threadCount: 12, baseClockGHz: 3.8, boostClockGHz: 5.1, tdpWatts: 65 },
  },
  {
    id: 102,
    name: 'AMD Ryzen 7 7800X3D',
    category: 'cpu',
    brand: 'AMD',
    price: 2_699.9,
    performanceScore: 96,
    powerDrawWatts: 120,
    image: '/assets/images/Processadores/102.webp',
    specifications: { socket: 'AM5', coreCount: 8, threadCount: 16, baseClockGHz: 4.2, boostClockGHz: 5, tdpWatts: 120 },
  },
  {
    id: 103,
    name: 'Intel Core i5-14600K',
    category: 'cpu',
    brand: 'Intel',
    price: 2_199.9,
    performanceScore: 91,
    powerDrawWatts: 181,
    image: '/assets/images/Processadores/103.jpg',
    specifications: { socket: 'LGA1700', coreCount: 14, threadCount: 20, baseClockGHz: 3.5, boostClockGHz: 5.3, tdpWatts: 181 },
  },
  {
    id: 104,
    name: 'Intel Core i7-14700K',
    category: 'cpu',
    brand: 'Intel',
    price: 3_099.9,
    performanceScore: 98,
    powerDrawWatts: 253,
    image: '/assets/images/Processadores/104.webp',
    specifications: { socket: 'LGA1700', coreCount: 20, threadCount: 28, baseClockGHz: 3.4, boostClockGHz: 5.6, tdpWatts: 253 },
  },
];
