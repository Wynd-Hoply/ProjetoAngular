import { Component } from '../models/component.model';

const componentImage = 'assets/images/LogoWM.png';

export const cases: Component[] = [
  {
    id: 701,
    name: 'Montech Air 100 ARGB',
    category: 'case',
    brand: 'Montech',
    price: 399.9,
    performanceScore: 70,
    powerDrawWatts: 0,
    image: '/assets/images/Gabinetes/701.jpg',
    specifications: { formFactor: 'Micro-ATX', supportedFormFactors: ['Micro-ATX', 'Mini-ITX'], gpuLengthMm: 330, coolerHeightMm: 161 },
  },
  {
    id: 702,
    name: 'NZXT H5 Flow',
    category: 'case',
    brand: 'NZXT',
    price: 599.9,
    performanceScore: 82,
    powerDrawWatts: 0,
    image: '/assets/images/Gabinetes/702.jpg',
    specifications: { formFactor: 'ATX', supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], gpuLengthMm: 365, coolerHeightMm: 165 },
  },
  {
    id: 703,
    name: 'Lian Li Lancool 216',
    category: 'case',
    brand: 'Lian Li',
    price: 799.9,
    performanceScore: 91,
    powerDrawWatts: 0,
    image: '/assets/images/Gabinetes/703.jpg',
    specifications: { formFactor: 'ATX', supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], gpuLengthMm: 392, coolerHeightMm: 180 },
  },
  {
    id: 704,
    name: 'Cougar MX330-G Air',
    category: 'case',
    brand: 'Cougar',
    price: 299.9,
    performanceScore: 58,
    powerDrawWatts: 0,
    image: '/assets/images/Gabinetes/704.jpg',
    specifications: { formFactor: 'ATX', supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], gpuLengthMm: 350, coolerHeightMm: 155 },
  },
];
