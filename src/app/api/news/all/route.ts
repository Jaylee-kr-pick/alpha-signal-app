import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function GET() {
  // All query parameters are properly escaped to avoid ERR_UNESCAPED_CHARACTERS
  const feed = await parser.parseURL('https://news.google.com/rss/search?q=%EA%B2%BD%EC%A0%9C&hl=ko&gl=KR&ceid=KR:ko');
  const articles = feed.items?.map(item => ({
    title: item.title || '',
    link: item.link || '',
    pubDate: item.pubDate || '',
    summary: item.contentSnippet || '',
  })) || [];

  return NextResponse.json({ articles });
}