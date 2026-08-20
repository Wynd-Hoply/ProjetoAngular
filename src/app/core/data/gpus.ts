import { Component } from '../models/component.model';

const componentImage = 'assets/images/LogoWM.png';

export const gpus: Component[] = [
  {
    id: 201,
    name: 'GeForce RTX 4060 8GB Twin Fan',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 1_899.9,
    performanceScore: 76,
    powerDrawWatts: 115,
    image: componentImage,
    specifications: { vramGB: 8, memoryType: 'GDDR6', memorySpeedMHz: 17000, interface: 'PCIe 4.0 x8', tdpWatts: 115, gpuLengthMm: 240 },
  },
  {
    id: 202,
    name: 'Radeon RX 7700 XT 12GB',
    category: 'gpu',
    brand: 'AMD',
    price: 2_899.9,
    performanceScore: 88,
    powerDrawWatts: 245,
    image: componentImage,
    specifications: { vramGB: 12, memoryType: 'GDDR6', memorySpeedMHz: 18000, interface: 'PCIe 4.0 x16', tdpWatts: 245, gpuLengthMm: 320 },
  },
  {
    id: 203,
    name: 'GeForce RTX 4070 Super 12GB',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 4_199.9,
    performanceScore: 94,
    powerDrawWatts: 220,
    image: componentImage,
    specifications: { vramGB: 12, memoryType: 'GDDR6X', memorySpeedMHz: 21000, interface: 'PCIe 4.0 x16', tdpWatts: 220, gpuLengthMm: 300 },
  },
  {
    id: 204,
    name: 'Radeon RX 7900 XTX 24GB',
    category: 'gpu',
    brand: 'AMD',
    price: 6_499.9,
    performanceScore: 99,
    powerDrawWatts: 355,
    image: componentImage,
    specifications: { vramGB: 24, memoryType: 'GDDR6', memorySpeedMHz: 20000, interface: 'PCIe 4.0 x16', tdpWatts: 355, gpuLengthMm: 345 },
  },
];
