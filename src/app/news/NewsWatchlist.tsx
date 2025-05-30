'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

type Article = {
  title: string;
  link: string;
  pubDate?: string;
  ticker?: string;
  name?: string;
};

export default function NewsWatchlist() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageMap, setPageMap] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchWatchlistNews = async () => {
      if (!user) {
        console.error('❌ 유저 없음: 로그인 필요');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/news/watchlist?uid=${user.uid}`, { next: { revalidate: 60 } });
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (!json || !Array.isArray(json.articles)) {
          throw new Error('Invalid JSON response');
        }
        console.log('📰 관심종목 뉴스 fetch 성공:', json);
        setArticles(
          json.articles.sort((a, b) => {
            const dateA = new Date(a.pubDate || '').getTime();
            const dateB = new Date(b.pubDate || '').getTime();
            return dateB - dateA;
          })
        );
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
  }, [user]);

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
                    : '기타';
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(article);
                  return groups;
                }, {} as { [key: string]: Article[] })
              ).map(([name, group], idx) => {
                const currentPage = pageMap[name] || 1;
                const itemsPerPage = 5;
                const startIdx = (currentPage - 1) * itemsPerPage;
                const pageArticles = group.slice(startIdx, startIdx + itemsPerPage);
                const totalPages = Math.ceil(group.length / itemsPerPage);

                return (
                  <details key={idx} className="border rounded p-2 mb-4 w-full">
                    <summary className="cursor-pointer font-semibold text-lg">
                      {name}
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
                              [name]: Math.max(1, currentPage - 1),
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
                                setPageMap((prev) => ({ ...prev, [name]: pageNum }))
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
                              [name]: Math.min(totalPages, currentPage + 1),
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