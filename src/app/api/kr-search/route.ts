import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { NextResponse } from 'next/server';

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query) return NextResponse.json({ results: [] });

  try {
    const snapshot = await getDocs(collection(db, 'kr-stocks'));
    const results = snapshot.docs
      .map(doc => doc.data())
      .filter(
        stock =>
          stock.name.includes(query) ||
          stock.ticker.includes(query)
      );

    return NextResponse.json({ results });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Firebase 검색 실패:', error.message);
      return NextResponse.json(
        {
          message: error.message,
          details: error.stack,
        },
        { status: 500 }
      );
    } else {
      console.error('❌ Firebase 검색 실패: 알 수 없는 에러', error);
      return NextResponse.json(
        {
          message: 'Firebase 검색 실패',
          details: String(error),
        },
        { status: 500 }
      );
    }
  }
}