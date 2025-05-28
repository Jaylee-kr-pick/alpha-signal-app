// src/app/api/kr-search/route.ts
import { NextResponse } from 'next/server';
import { getKisAccessToken } from './kis-token';
import { searchStockByName } from './kr-quote';

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query) return NextResponse.json({ results: [] });

  try {
    const accessToken = await getKisAccessToken();
    const { results } = await searchStockByName(query, accessToken);
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('❌ KIS 검색 실패:', error);
    return NextResponse.json(
      {
        message: error?.message || 'KIS 검색 실패',
        details: error,
      },
      { status: 500 }
    );
  }
}