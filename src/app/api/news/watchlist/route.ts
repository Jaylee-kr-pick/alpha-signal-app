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

export async function GET() {
  try {
    const userId = 'kKffbyTAhOXdyKNNThJv'; // Example static user ID
    const snapshot = await getDocs(collection(db, `user/${userId}/watchlist`));

    const allArticles: Record<string, unknown>[] = [];

    for (const doc of snapshot.docs) {
      const { name } = doc.data();
      if (!name) continue;

      const encodedKeyword = encodeURIComponent(name);
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
        const articles = items.map((item: {
          title?: string[];
          link?: string[];
          pubDate?: string[];
        }) => ({
          title: item.title?.[0] || '',
          link: item.link?.[0] || '',
          pubDate: item.pubDate?.[0] || '',
          name: name,
        }));

        allArticles.push(...articles);
      } catch (fetchErr) {
        console.error(`❌ Fetch/parsing 에러 for keyword "${name}":`, fetchErr);
      }
    }

    return NextResponse.json({ articles: allArticles });
  } catch (error) {
    console.error('🔥 전체 watchlist fetch 실패:', error);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}