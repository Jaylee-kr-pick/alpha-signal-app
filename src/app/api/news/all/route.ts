import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function GET() {
  const feed = await parser.parseURL('https://rss.etoday.co.kr/news/economy.xml');
  const articles = feed.items?.map(item => ({
    title: item.title || '',
    link: item.link || '',
    pubDate: item.pubDate || '',
    summary: item.contentSnippet || '',
  })) || [];

  return NextResponse.json({ articles });
}