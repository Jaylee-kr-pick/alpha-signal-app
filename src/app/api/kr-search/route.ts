// src/app/api/kr-search/route.ts
import { NextResponse } from 'next/server';
import { getKisAccessToken } from '@/utils/kis-token';
import { searchStockByName } from '@/utils/kr-quote';

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query) return NextResponse.json({ results: [] });

  try {
    const accessToken = await getKisAccessToken();
    const results = await searchStockByName(query, accessToken);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('KIS API error:', error);
    return NextResponse.json({ error: '검색 중 오류 발생' }, { status: 500 });
  }
}