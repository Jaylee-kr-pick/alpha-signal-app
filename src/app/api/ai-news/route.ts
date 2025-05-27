import Parser from 'rss-parser';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  [key: string]: unknown;
}

export async function GET() {
  const parser = new Parser();
  const feed = await parser.parseURL('https://finance.naver.com/rss/main.nhn');

  const items: RssItem[] = (feed.items as RssItem[]).map((item) => ({
    title: item.title || '',
    link: item.link || '',
    pubDate: item.pubDate || '',
  }));

  return new Response(JSON.stringify({ articles: items }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}