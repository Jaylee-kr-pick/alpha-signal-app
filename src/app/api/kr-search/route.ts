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
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ KIS 검색 실패:', error.message);
      return NextResponse.json(
        {
          message: error.message,
          details: error.stack,
        },
        { status: 500 }
      );
    } else {
      console.error('❌ KIS 검색 실패: 알 수 없는 에러', error);
      return NextResponse.json(
        {
          message: 'KIS 검색 실패',
          details: String(error),
        },
        { status: 500 }
      );
    }
  }
}