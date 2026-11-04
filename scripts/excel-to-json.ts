import * as XLSX from 'xlsx';
import * as fs from 'fs';

const workbook = XLSX.readFile('hardware_products.xlsx');

const sheet = workbook.Sheets[workbook.SheetNames[0]];

const data = XLSX.utils.sheet_to_json(sheet);

fs.writeFileSync(
  'src/app/data/produtos.json',
  JSON.stringify(data, null, 2)
);

console.log('Excel convertido para JSON!');