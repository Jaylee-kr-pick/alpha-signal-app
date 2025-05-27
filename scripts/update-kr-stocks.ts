// scripts/update-kr-stocks.ts
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const inputCsvPath = path.join(process.cwd(), 'scripts', 'kr-stock-list.csv');
const outputJsonPath = path.join(process.cwd(), 'src', 'data', 'kr-stocks.json');

const results: any[] = [];

fs.createReadStream(inputCsvPath)
  .pipe(csv())
  .on('data', (row) => {
    results.push({
      name: row['한글종목명'] || row['종목명'],
      code: row['종목코드'] || row['code'],
      market: row['시장구분'] || row['market'],
    });
  })
  .on('end', () => {
    fs.writeFileSync(outputJsonPath, JSON.stringify(results, null, 2));
    console.log(`✅ 변환 완료: ${results.length}개 종목 → kr-stocks.json`);
  });