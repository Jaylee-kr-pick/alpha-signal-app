import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const url = `https://finance.naver.com/search/searchList.naver?query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    const buffer = await res.arrayBuffer();
    const decoded = iconv.decode(Buffer.from(buffer), 'euc-kr');

    // ✅ HTML 구조 확인용 로그
    console.log('🔥 decoded HTML sample:\n', decoded.slice(0, 1000));

    const $ = cheerio.load(decoded);

    const results: { name: string; code: string }[] = [];

    $('table.type_5 tbody tr').each((_, el) => {
      const anchor = $(el).find('td.tit a');
      const name = anchor.text().trim();
      const href = anchor.attr('href');
      const match = href?.match(/code=(\d+)/);
      const code = match ? match[1] : '';

      if (name && code) {
        results.push({ name, code });
      }
    });

    console.log('📊 파싱된 종목 수:', results.length);

    return NextResponse.json({ results });
  } catch (err) {
    console.error('❌ 네이버 검색 크롤링 실패:', err);
    return NextResponse.json({ results: [] });
  }
}