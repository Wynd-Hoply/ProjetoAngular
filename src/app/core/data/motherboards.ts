import { Component } from '../models/component.model';

const componentImage = 'assets/images/LogoWM.png';

export const motherboards: Component[] = [
  {
    id: 301,
    name: 'MSI PRO B650M-A WiFi',
    category: 'motherboard',
    brand: 'MSI',
    price: 1_199.9,
    performanceScore: 70,
    powerDrawWatts: 55,
    image: componentImage,
    specifications: { socket: 'AM5', chipset: 'B650', formFactor: 'Micro-ATX', ramType: 'DDR5', ramSlots: 4, memorySpeedMHz: 6400 },
  },
  {
    id: 302,
    name: 'ASUS TUF Gaming B650-Plus',
    category: 'motherboard',
    brand: 'ASUS',
    price: 1_699.9,
    performanceScore: 82,
    powerDrawWatts: 65,
    image: componentImage,
    specifications: { socket: 'AM5', chipset: 'B650', formFactor: 'ATX', ramType: 'DDR5', ramSlots: 4, memorySpeedMHz: 7600 },
  },
  {
    id: 303,
    name: 'Gigabyte B760M Aorus Elite AX',
    category: 'motherboard',
    brand: 'Gigabyte',
    price: 1_249.9,
    performanceScore: 78,
    powerDrawWatts: 60,
    image: componentImage,
    specifications: { socket: 'LGA1700', chipset: 'B760', formFactor: 'Micro-ATX', ramType: 'DDR5', ramSlots: 4, memorySpeedMHz: 7600 },
  },
  {
    id: 304,
    name: 'ASUS ROG Strix Z790-E Gaming',
    category: 'motherboard',
    brand: 'ASUS',
    price: 2_799.9,
    performanceScore: 95,
    powerDrawWatts: 80,
    image: componentImage,
    specifications: { socket: 'LGA1700', chipset: 'Z790', formFactor: 'ATX', ramType: 'DDR5', ramSlots: 4, memorySpeedMHz: 8000 },
  },
];
