// src/app/api/kr-search/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const STOCKS_PATH = path.resolve(process.cwd(), 'public/data/kr_stocks.csv');

type StockItem = {
  code: string;
  standardCode: string;
  name: string;
};

function cleanName(name: string): string {
  return name.replace(/\s+ST.*$/, '').trim(); // "삼성전자     ST100..." → "삼성전자"
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query) return NextResponse.json({ results: [] });

  const results: StockItem[] = [];

  return new Promise<Response>((resolve) => {
    fs.createReadStream(STOCKS_PATH)
      .pipe(csv())
      .on('data', (row) => {
        const name = cleanName(row['한글명']);
        if (name.includes(query)) {
          results.push({
            code: row['단축코드'],
            standardCode: row['표준코드'],
            name,
          });
        }
      })
      .on('end', () => {
        const response = NextResponse.json({ results });
        resolve(response);
      });
  });
}