// Importa hardware_products.xlsx (Kabum) para o catálogo do PCraft.
//
// Uso (na raiz do projeto):
//   node scripts/import-products.mjs                       -> só produtos em estoque
//   node scripts/import-products.mjs --include-out-of-stock
//   node scripts/import-products.mjs outro-arquivo.xlsx
//
// Saída: um arquivo por categoria em src/app/core/data/, com os MESMOS nomes e exports dos mocks
// (processors.ts, gpus.ts, motherboards.ts, ram.ts, storage.ts, psus.ts, coolers.ts), então o
// CatalogService continua funcionando sem alterações.
// Categorias sem nenhum produto na planilha (ex.: gabinetes) NÃO são tocadas.
// Mocks existentes são salvos como <arquivo>.ts.bak antes de serem sobrescritos.

import XLSX from 'xlsx';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const INPUT = args.find((a) => a.endsWith('.xlsx')) ?? 'hardware_products.xlsx';
const INCLUDE_OUT_OF_STOCK = args.includes('--include-out-of-stock');
const OUTPUT_DIR = 'src/app/core/data';
const FALLBACK_IMAGE = 'assets/images/LogoWM.png';

// ---------------------------------------------------------------- utilidades

const num = (s) =>
  Number(
    String(s)
      .replace(/\.(?=\d{3}\b)/g, '')
      .replace(',', '.'),
  );
const first = (text, regex) => regex.exec(text)?.[1];
const normSocket = (s) => s.toUpperCase().replace(/[\s-]/g, '');

const SOCKET_RE = /\b(AM4|AM5|LGA\s?-?\d{4})\b/i;
const AMD_SOCKETS = ['AM4', 'AM5'];
const INTEL_SOCKETS = ['LGA1150', 'LGA1151', 'LGA1155', 'LGA1200', 'LGA1700', 'LGA1851'];

const BRANDS = [
  'Cooler Master',
  'Rise Mode',
  'Lian Li',
  'Western Digital',
  'Team Group',
  'Be Quiet',
  'Super Flower',
  'ASUS',
  'MSI',
  'Gigabyte',
  'ASRock',
  'Biostar',
  'Colorful',
  'AMD',
  'Intel',
  'NVIDIA',
  'XFX',
  'PNY',
  'Galax',
  'Zotac',
  'Sapphire',
  'PowerColor',
  'Palit',
  'Gainward',
  'Inno3D',
  'Afox',
  'Corsair',
  'Kingston',
  'Husky',
  'Redragon',
  'Montech',
  'DeepCool',
  'Thermaltake',
  'NZXT',
  'Noctua',
  'Pichau',
  'Gamdias',
  'Mancer',
  'Fortrek',
  'EVGA',
  'WD',
  'Seagate',
  'Crucial',
  'Samsung',
  'SanDisk',
  'Adata',
  'XPG',
  'Patriot',
  'G.Skill',
  'Lexar',
  'HyperX',
  'Netac',
  'Goldenfir',
  'Toshiba',
  'Acer',
  'Predator',
  'Seasonic',
  'Antec',
  'Gamemax',
  'Bluecase',
  'Hayom',
  'Knup',
  'MACH1',
  'FSP',
  'Aigo',
  'Hikvision',
  'Mushkin',
  'Ocelot',
  'Aerocool',
  'Duex',
  'Kalkan',
  'C3Tech',
];
const BRAND_RE = BRANDS.map((b) => ({
  brand: b,
  re: new RegExp(`(?<![\\w])${b.replace('.', '\\.')}(?![\\w])`, 'i'),
}));

function detectBrand(name) {
  let best;
  for (const { brand, re } of BRAND_RE) {
    const idx = name.search(re);
    if (idx >= 0 && (!best || idx < best.idx)) best = { brand, idx };
  }
  return best?.brand ?? 'Outras marcas';
}

// Quando o nome não cita a marca (ex.: "Processador Core i5 8400"), usa o fabricante do chip.
function chipVendor(category, name) {
  if (category !== 'cpu') return undefined;
  if (/\b(core|intel|pentium|celeron)\b/i.test(name)) return 'Intel';
  if (/\b(ryzen|athlon|amd)\b/i.test(name)) return 'AMD';
  return undefined;
}

// ---------------------------------------------------- classificação por nome
// Os nomes da Kabum começam pelo tipo do produto ("Placa-Mãe ...", "SSD ...").
// Por isso ancoramos no início — "TRIPLE FAN" no meio do nome de uma GPU não deve excluí-la.

const NOT_FOR_BUILDER =
  /notebook|sodimm|so-dimm|servidor|server|\becc\b|rdimm|quadro|tesla|radeon pro|workstation|\bnas\b|xeon|externo|port[aá]til|\busb\b/i;

function classify(name) {
  const n = name.trim();
  if (/^(kit|combo)\b/i.test(n) || / \+ /.test(n)) return 'kit';
  if (NOT_FOR_BUILDER.test(n)) return 'excluido';
  if (/^placa[- ]m[aã]e/i.test(n)) return 'motherboard';
  if (/^(placa de v[ií]deo|placa v[ií]deo|gpu)\b/i.test(n)) return 'gpu';
  if (/^processador/i.test(n)) return 'cpu';
  if (/^mem[oó]ria/i.test(n) && /\bddr[345]\b/i.test(n)) return 'ram';
  if (/^(ssd|hd|hdd|disco)\b/i.test(n)) return 'storage';
  if (/^fonte/i.test(n) && !/teste|carregador|adaptador/i.test(n)) return 'psu';
  if (/^(water ?cooler|air cooler|dissipador)/i.test(n)) return 'cooler';
  if (/^cooler/i.test(n) && !/para gabinete/i.test(n) && /AM[45]|LGA|intel|amd|socket/i.test(n))
    return 'cooler';
  return 'outro';
}

// ----------------------------------------------- specs extraídas do nome
// Devolve { specs, powerDrawWatts } ou null quando falta uma spec essencial
// para a validação de compatibilidade (socket, tipo de RAM, potência...).

const clockValues = (name) => [...name.matchAll(/(\d+(?:[.,]\d+)?)\s*ghz/gi)].map((m) => num(m[1]));

function extract(category, name) {
  const s = {};
  switch (category) {
    case 'cpu': {
      const socket = first(name, SOCKET_RE);
      if (!socket) return null;
      s.socket = normSocket(socket);
      const cores = first(name, /(\d+)\s*-?\s*(?:core|n[uú]cleo)/i);
      const threads = first(name, /(\d+)\s*threads?/i);
      if (cores) s.coreCount = Number(cores);
      if (threads) s.threadCount = Number(threads);
      const clocks = clockValues(name);
      if (clocks.length) s.baseClockGHz = Math.min(...clocks);
      if (clocks.length > 1) s.boostClockGHz = Math.max(...clocks);
      return { specs: s, powerDrawWatts: 95 };
    }
    case 'motherboard': {
      const socket = first(name, SOCKET_RE);
      const ramType = first(name, /\b(DDR[45])\b/i);
      if (!socket || !ramType) return null;
      s.socket = normSocket(socket);
      s.ramType = ramType.toUpperCase();
      const chipset = first(name, /\b([ABHXZ]\d{3}E?)M?\b/);
      if (chipset) s.chipset = chipset;
      if (/\be-?atx\b/i.test(name)) s.formFactor = 'E-ATX';
      else if (/\b(m-?atx|micro[\s-]?atx)\b/i.test(name)) s.formFactor = 'Micro-ATX';
      else if (/\b(mini[\s-]?itx|itx)\b/i.test(name)) s.formFactor = 'Mini-ITX';
      else if (/\batx\b/i.test(name)) s.formFactor = 'ATX';
      return { specs: s, powerDrawWatts: 50 };
    }
    case 'gpu': {
      const vram = first(name, /(\d+)\s*GB/i);
      if (!vram) return null;
      s.vramGB = Number(vram);
      const mem = first(name, /\b(GDDR\d+X?)\b/i);
      if (mem) s.memoryType = mem.toUpperCase();
      const watts =
        s.vramGB <= 4
          ? 75
          : s.vramGB <= 8
            ? 150
            : s.vramGB <= 12
              ? 200
              : s.vramGB <= 16
                ? 250
                : 320;
      return { specs: s, powerDrawWatts: watts };
    }
    case 'ram': {
      const type = first(name, /\b(DDR[45])\b/i); // o model só aceita DDR4/DDR5
      if (!type) return null;
      s.ramType = type.toUpperCase();
      const kit = /(\d+)\s*x\s*(\d+)\s*GB/i.exec(name);
      const gb = kit ? Number(kit[1]) * Number(kit[2]) : Number(first(name, /(\d+)\s*GB/i));
      if (!gb) return null;
      s.capacityGB = gb;
      const speed = first(name, /(\d{4,5})\s*MHz/i) ?? first(name, /DDR[45][- ](\d{4})/i);
      if (speed) s.memorySpeedMHz = Number(speed);
      return { specs: s, powerDrawWatts: 10 };
    }
    case 'storage': {
      const cap = /(\d+(?:[.,]\d+)?)\s*(TB|GB)\b/i.exec(name);
      if (!cap) return null;
      s.capacityGB = Math.round(num(cap[1]) * (cap[2].toUpperCase() === 'TB' ? 1000 : 1));
      const gen = first(name, /pcie\s*(\d(?:\.\d)?)/i);
      if (/nvme/i.test(name)) s.interface = gen ? `PCIe ${gen} x4` : 'NVMe';
      else if (/m\.?2/i.test(name)) s.interface = 'M.2';
      else s.interface = 'SATA III';
      const read = first(name, /leitura[:\s]*(?:de\s*|at[eé]\s*)?([\d.,]+)\s*MB/i);
      const write = first(name, /grava[cç][aã]o[:\s]*(?:de\s*|at[eé]\s*)?([\d.,]+)\s*MB/i);
      if (read) s.readSpeedMBps = Math.round(num(read));
      if (write) s.writeSpeedMBps = Math.round(num(write));
      return { specs: s, powerDrawWatts: /nvme/i.test(name) ? 8 : 5 };
    }
    case 'psu': {
      const w = Number(first(name, /(\d{3,4})\s*W\b/i));
      if (!w || w < 200) return null;
      s.wattage = w;
      const eff = first(name, /80\s*plus\s*(white|bronze|silver|gold|platinum|titanium)/i);
      if (eff) s.efficiency = `80 Plus ${eff[0].toUpperCase()}${eff.slice(1).toLowerCase()}`;
      s.modular = /\bmodular\b/i.test(name) && !/semi|n[aã]o/i.test(name);
      return { specs: s, powerDrawWatts: 0 };
    }
    case 'cooler': {
      const explicit = [...name.matchAll(new RegExp(SOCKET_RE, 'gi'))].map((m) => normSocket(m[1]));
      const amd = /\bamd\b/i.test(name);
      const intel = /\bintel\b/i.test(name);
      const sockets = new Set(explicit);
      if (amd) AMD_SOCKETS.forEach((x) => sockets.add(x));
      if (intel) INTEL_SOCKETS.forEach((x) => sockets.add(x));
      if (!sockets.size) return null;
      s.supportedSockets = [...sockets];
      const water = /water/i.test(name);
      const rad = first(name, /\b(120|140|240|280|360|420)\s*mm/i);
      if (water && rad) s.radiatorSizeMm = Number(rad);
      return { specs: s, powerDrawWatts: water ? 12 : 6 };
    }
    default:
      return null;
  }
}

// ------------------------------------------------------------------ pipeline

const wb = XLSX.readFile(INPUT);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

const stats = {
  lidas: rows.length,
  duplicadas: 0,
  semEstoque: 0,
  kits: 0,
  foraDoEscopo: 0,
  semSpecs: 0,
};
const seen = new Set();
const products = [];

for (const row of rows) {
  const id = Number(row['ID']);
  if (seen.has(id)) {
    stats.duplicadas++;
    continue;
  }
  seen.add(id);

  if (!INCLUDE_OUT_OF_STOCK && !(Number(row['Quantity Available']) > 0)) {
    stats.semEstoque++;
    continue;
  }

  const name = String(row['Name']).replace(/\s+/g, ' ').trim();
  const category = classify(name);
  if (category === 'kit') {
    stats.kits++;
    continue;
  }
  if (category === 'excluido' || category === 'outro') {
    stats.foraDoEscopo++;
    continue;
  }

  const extracted = extract(category, name);
  if (!extracted) {
    stats.semSpecs++;
    continue;
  }

  // Preço pago de fato (com desconto), caindo para o preço cheio se não houver.
  const discounted = Number(row['Price with Discount']);
  const price = Math.round((discounted > 0 ? discounted : Number(row['Price'])) * 100) / 100;
  if (!(price > 0)) {
    stats.foraDoEscopo++;
    continue;
  }

  // Coluna "Photos (g)" é uma lista em texto; o model só tem uma imagem.
  const image =
    first(String(row['Photos (g)'] ?? ''), /(https?:\/\/[^'"\s,\]]+)/) ?? FALLBACK_IMAGE;

  products.push({
    id,
    name,
    category,
    brand: ((b) => (b === 'Outras marcas' ? (chipVendor(category, name) ?? b) : b))(
      detectBrand(name),
    ),
    price,
    performanceScore: 0, // calculado abaixo
    powerDrawWatts: extracted.powerDrawWatts,
    image,
    specifications: extracted.specs,
  });
}

// A planilha não traz desempenho. Estimativa provisória: posição do preço dentro
// da própria categoria, mapeada para 40–98. Troque por benchmark real quando houver.
for (const category of new Set(products.map((p) => p.category))) {
  const group = products.filter((p) => p.category === category).sort((a, b) => a.price - b.price);
  group.forEach((p, i) => {
    const pct = group.length > 1 ? i / (group.length - 1) : 0.5;
    p.performanceScore = Math.round(40 + pct * 58);
  });
}

// category -> [nome do arquivo, nome do export] — idênticos aos mocks em core/data.
const TARGETS = {
  cpu: ['processors', 'processors'],
  gpu: ['gpus', 'gpus'],
  motherboard: ['motherboards', 'motherboards'],
  ram: ['ram', 'ram'],
  storage: ['storage', 'storage'],
  psu: ['psus', 'psus'],
  cooler: ['coolers', 'coolers'],
  case: ['cases', 'cases'], // a planilha não traz gabinetes -> cases.ts não é tocado
};

const origem = `${INPUT} (Kabum), ${INCLUDE_OUT_OF_STOCK ? 'com' : 'somente'} itens ${INCLUDE_OUT_OF_STOCK ? 'sem estoque incluídos' : 'em estoque'}`;
mkdirSync(OUTPUT_DIR, { recursive: true });

const gerados = [];
const ignorados = [];
const porCategoria = {};

for (const [category, [file, exportName]] of Object.entries(TARGETS)) {
  const group = products.filter((p) => p.category === category).sort((a, b) => a.price - b.price);
  porCategoria[category] = group.length;
  if (!group.length) {
    ignorados.push(`${file}.ts (0 produtos na planilha — mantido como está)`);
    continue;
  }

  const path = `${OUTPUT_DIR}/${file}.ts`;
  // Guarda o mock original uma única vez (se o arquivo atual não for um gerado por este script).
  if (existsSync(path) && !readFileSync(path, 'utf-8').includes('ARQUIVO GERADO')) {
    copyFileSync(path, `${path}.bak`);
  }

  const body = group.map((p) => `  ${JSON.stringify(p)},`).join('\n');
  writeFileSync(
    path,
    `// ARQUIVO GERADO por scripts/import-products.mjs — não edite à mão.
// Fonte: ${origem}.
// performanceScore é uma ESTIMATIVA (posição do preço na categoria), não um benchmark.
import { Component } from '../models/component.model';

export const ${exportName}: Component[] = [
${body}
];
`,
  );
  gerados.push(`${file}.ts (${group.length})`);
}

console.log(`\nImportação concluída em ${OUTPUT_DIR}/`);
console.table(stats);
console.log('Gerados:', gerados.join(', '));
if (ignorados.length) console.log('Não alterados:', ignorados.join(', '));
console.log('Produtos por categoria:', porCategoria, `| total: ${products.length}`);
const semMarca = products.filter((p) => p.brand === 'Outras marcas').length;
if (semMarca)
  console.log(`Atenção: ${semMarca} produto(s) sem marca reconhecida ("Outras marcas").`);
