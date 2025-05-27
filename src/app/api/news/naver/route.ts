// src/app/api/news/naver/route.ts
import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export async function GET() {
  const res = await fetch('https://rss.etnews.com/Section901.xml');
  const xml = await res.text();

  const parser = new XMLParser();
  const data = parser.parse(xml);

  const items = data.rss?.channel?.item || [];

  type NaverRssItem = {
    title: string;
    link: string;
    pubDate: string;
  };

  const articles = items.map((item: NaverRssItem) => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
  }));

  return NextResponse.json({ articles });
}