import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const url = `https://search.daum.net/search?w=tot&q=${encodeURIComponent(query + ' 주가')}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    const buffer = await res.arrayBuffer();
    const decoded = iconv.decode(Buffer.from(buffer), 'euc-kr');
    const $ = cheerio.load(decoded);

    const results: { name: string; code: string }[] = [];

    $('a.f_link_bu').each((_, el) => {
      const name = $(el).text().trim();
      const href = $(el).attr('href');
      const match = href?.match(/\/quotes\/(A\d{6})/);
      const code = match ? match[1] : '';

      if (name && code) {
        results.push({ name, code });
      }
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error('❌ 다음 검색 크롤링 실패:', err);
    return NextResponse.json({ results: [] });
  }
}