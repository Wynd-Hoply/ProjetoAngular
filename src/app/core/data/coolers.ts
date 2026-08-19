import { Component } from '../models/component.model';

const componentImage = 'assets/images/LogoWM.png';

export const coolers: Component[] = [
  {
    id: 801,
    name: 'DeepCool AG400',
    category: 'cooler',
    brand: 'DeepCool',
    price: 179.9,
    performanceScore: 66,
    powerDrawWatts: 3,
    image: componentImage,
    specifications: { coolerHeightMm: 150, supportedSockets: ['AM4', 'AM5', 'LGA1700'] },
  },
  {
    id: 802,
    name: 'Cooler Master Hyper 212 Halo',
    category: 'cooler',
    brand: 'Cooler Master',
    price: 249.9,
    performanceScore: 73,
    powerDrawWatts: 4,
    image: componentImage,
    specifications: { coolerHeightMm: 154, supportedSockets: ['AM4', 'AM5', 'LGA1700'] },
  },
  {
    id: 803,
    name: 'Noctua NH-D15 chromax.black',
    category: 'cooler',
    brand: 'Noctua',
    price: 699.9,
    performanceScore: 94,
    powerDrawWatts: 5,
    image: componentImage,
    specifications: { coolerHeightMm: 168, supportedSockets: ['AM4', 'AM5', 'LGA1700'] },
  },
  {
    id: 804,
    name: 'NZXT Kraken 240 RGB',
    category: 'cooler',
    brand: 'NZXT',
    price: 899.9,
    performanceScore: 91,
    powerDrawWatts: 8,
    image: componentImage,
    specifications: { radiatorSizeMm: 240, supportedSockets: ['AM4', 'AM5', 'LGA1700'] },
  },
];
