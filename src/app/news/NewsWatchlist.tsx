'use client';

import { useEffect, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  // 필요한 Firebase 설정을 여기에 삽입하세요
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}
const db = getFirestore(app);

type Article = {
  title: string;
  link: string;
  pubDate?: string;
  ticker?: string;
  name?: string;
};

export default function NewsWatchlist() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageMap, setPageMap] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchWatchlistNews = async () => {
      try {
        const res = await fetch('/api/news/watchlist', { next: { revalidate: 60 } });
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (!json || !Array.isArray(json.articles)) {
          throw new Error('Invalid JSON response');
        }
        console.log('📰 관심종목 뉴스 fetch 성공:', json);
        setArticles(json.articles);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('❌ 관심종목 뉴스 fetch 실패:', error.message, error.stack);
        } else {
          console.error('❌ 관심종목 뉴스 fetch 실패:', error);
        }
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistNews();
  }, []);

  return (
    <div className="p-4 w-full">
      {loading ? (
        <p>⏳ 관심종목 뉴스를 불러오는 중...</p>
      ) : (
        <>
          {articles.length === 0 ? (
            <p>📭 관심종목 관련 뉴스가 없습니다.</p>
          ) : (
            <>
              {Object.entries(
                articles.reduce((groups, article) => {
                  const key = (article.name?.trim() && article.name !== '기타')
                    ? article.name
                    : (article.ticker?.trim() && article.ticker !== '기타')
                    ? article.ticker
                    : '기타';
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(article);
                  return groups;
                }, {} as { [key: string]: Article[] })
              ).map(([ticker, group], idx) => {
                const currentPage = pageMap[ticker] || 1;
                const itemsPerPage = 5;
                const startIdx = (currentPage - 1) * itemsPerPage;
                const pageArticles = group.slice(startIdx, startIdx + itemsPerPage);
                const totalPages = Math.ceil(group.length / itemsPerPage);

                return (
                  <details key={idx} className="border rounded p-2 mb-4 w-full">
                    <summary className="cursor-pointer font-semibold text-lg">
                      {ticker !== '기타' ? ticker : '기타'}
                    </summary>
                    <ul className="mt-2 space-y-2 pl-4">
                      {pageArticles.map((article, i) => (
                        <li key={i}>
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {article.title}
                          </a>
                          {article.pubDate && (
                            <p className="text-xs text-gray-500">
                              {new Date(article.pubDate).toLocaleString()}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    {totalPages > 1 && (
                      <div className="flex justify-center gap-1 mt-2 flex-wrap">
                        <button
                          onClick={() =>
                            setPageMap((prev) => ({
                              ...prev,
                              [ticker]: Math.max(1, currentPage - 1),
                            }))
                          }
                          className="px-2 py-1 border rounded"
                        >
                          &lt;
                        </button>
                        {Array.from({ length: totalPages }, (_, pageNum) => pageNum + 1)
                          .slice(
                            Math.max(0, currentPage - 1),
                            Math.min(totalPages, currentPage + 2)
                          )
                          .map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() =>
                                setPageMap((prev) => ({ ...prev, [ticker]: pageNum }))
                              }
                              className={`px-2 py-1 border rounded ${
                                currentPage === pageNum ? 'bg-gray-200' : ''
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                        <button
                          onClick={() =>
                            setPageMap((prev) => ({
                              ...prev,
                              [ticker]: Math.min(totalPages, currentPage + 1),
                            }))
                          }
                          className="px-2 py-1 border rounded"
                        >
                          &gt;
                        </button>
                      </div>
                    )}
                  </details>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}