import { Component } from '../models/component.model';

const componentImage = 'assets/images/LogoWM.png';

export const psus: Component[] = [
  {
    id: 601,
    name: 'Corsair CX650 650W',
    category: 'psu',
    brand: 'Corsair',
    price: 399.9,
    performanceScore: 68,
    powerDrawWatts: 0,
    image: componentImage,
    specifications: { wattage: 650, efficiency: '80 Plus Bronze', modular: false },
  },
  {
    id: 602,
    name: 'Cooler Master MWE Gold 750 V2',
    category: 'psu',
    brand: 'Cooler Master',
    price: 599.9,
    performanceScore: 82,
    powerDrawWatts: 0,
    image: componentImage,
    specifications: { wattage: 750, efficiency: '80 Plus Gold', modular: true },
  },
  {
    id: 603,
    name: 'XPG Core Reactor II 850W',
    category: 'psu',
    brand: 'XPG',
    price: 799.9,
    performanceScore: 90,
    powerDrawWatts: 0,
    image: componentImage,
    specifications: { wattage: 850, efficiency: '80 Plus Gold', modular: true },
  },
  {
    id: 604,
    name: 'Corsair RM1000x Shift',
    category: 'psu',
    brand: 'Corsair',
    price: 1_299.9,
    performanceScore: 97,
    powerDrawWatts: 0,
    image: componentImage,
    specifications: { wattage: 1000, efficiency: '80 Plus Gold', modular: true },
  },
];
