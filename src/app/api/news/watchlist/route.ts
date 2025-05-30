import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('uid');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Correct collection paths
    const collections = [
      collection(db, 'user', userId, 'watchlist_ko_stocks'),
      collection(db, 'user', userId, 'watchlist_global_stocks'),
      collection(db, 'user', userId, 'watchlist_crypto_stocks'),
    ];

    type WatchlistItem = {
      symbol: string;
      name: string;
    };

    let allWatchlistItems: WatchlistItem[] = [];

    for (const colRef of collections) {
      const snapshot = await getDocs(colRef);
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data?.symbol && data?.name) {
          allWatchlistItems.push({ symbol: data.symbol, name: data.name });
        }
      }
    }

    if (allWatchlistItems.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    const allArticles: Record<string, unknown>[] = [];

    for (const item of allWatchlistItems) {
      const encodedKeyword = encodeURIComponent(item.symbol);
      const rssUrl = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=ko&gl=KR&ceid=KR:ko`;

      try {
        const res = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AlphaSignal/1.0; +https://example.com/bot)',
          },
        });

        if (!res.ok) {
          console.error(`❌ RSS fetch 실패 (${res.status}):`, rssUrl);
          continue;
        }

        const xml = await res.text();
        const parsed = await parseStringPromise(xml);

        const items = parsed?.rss?.channel?.[0]?.item || [];
        const articles = items.map((newsItem) => ({
          title: newsItem.title?.[0] || '',
          link: newsItem.link?.[0] || '',
          pubDate: newsItem.pubDate?.[0] || '',
          name: item.name, // Set correct name
          symbol: item.symbol, // Also include symbol for reference
        }));

        allArticles.push(...articles);
      } catch (fetchErr) {
        console.error(`❌ Fetch/parsing 에러 for keyword "${item.symbol}":`, fetchErr);
      }
    }

    return NextResponse.json({ articles: allArticles });
  } catch (error) {
    console.error('🔥 전체 watchlist fetch 실패:', error);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}