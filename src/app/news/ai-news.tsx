'use client';

import { useEffect, useState } from 'react';
import { Article } from '@/types/article'; // assuming this type is defined

export default function AiNews() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      const res = await fetch('/api/news/ai-news');
      const data = await res.json();
      setArticles(data.articles || []);
    };
    fetchNews();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">🧠 AI 뉴스 속보</h2>
      <ul className="space-y-4">
        {articles.map((article, idx) => (
          <li key={idx} className="border-b pb-2">
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              <p className="font-semibold">{article.title}</p>
            </a>
            <p className="text-xs text-gray-500">{article.pubDate}</p>
            <p className="text-sm text-gray-700 mt-1">{article.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}