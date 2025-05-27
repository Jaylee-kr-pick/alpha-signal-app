// src/app/api/news/ai-news/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function GET() {
  try {
    const feed = await parser.parseURL('https://finance.naver.com/rss/main.nhn');

    const articles = feed.items?.map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
    })) ?? [];

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('❌ 뉴스 파싱 실패:', error);
    return NextResponse.json({ articles: [] });
  }
}