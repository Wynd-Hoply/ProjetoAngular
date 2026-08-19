import { Component } from '../models/component.model';

const componentImage = 'assets/images/LogoWM.png';

export const ram: Component[] = [
  {
    id: 401,
    name: 'Kingston Fury Beast 16GB (2x8GB)',
    category: 'ram',
    brand: 'Kingston',
    price: 329.9,
    performanceScore: 62,
    powerDrawWatts: 8,
    image: componentImage,
    specifications: { capacityGB: 16, ramType: 'DDR4', memorySpeedMHz: 3200 },
  },
  {
    id: 402,
    name: 'Corsair Vengeance 32GB (2x16GB)',
    category: 'ram',
    brand: 'Corsair',
    price: 699.9,
    performanceScore: 78,
    powerDrawWatts: 10,
    image: componentImage,
    specifications: { capacityGB: 32, ramType: 'DDR5', memorySpeedMHz: 6000 },
  },
  {
    id: 403,
    name: 'G.Skill Trident Z5 Neo 32GB',
    category: 'ram',
    brand: 'G.Skill',
    price: 899.9,
    performanceScore: 88,
    powerDrawWatts: 10,
    image: componentImage,
    specifications: { capacityGB: 32, ramType: 'DDR5', memorySpeedMHz: 6400 },
  },
  {
    id: 404,
    name: 'Kingston Fury Renegade 64GB (2x32GB)',
    category: 'ram',
    brand: 'Kingston',
    price: 1_399.9,
    performanceScore: 92,
    powerDrawWatts: 14,
    image: componentImage,
    specifications: { capacityGB: 64, ramType: 'DDR5', memorySpeedMHz: 6000 },
  },
];
