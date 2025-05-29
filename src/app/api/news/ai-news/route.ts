// src/app/api/news/ai-news/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, Timestamp, getDoc, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const FETCH_INTERVAL = 30 * 60 * 1000; // 30분

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const parser = new Parser();

const FEED_URL = 'https://rss.etnews.com/Section901.xml';

export async function GET() {
  try {
    const now = Date.now();

    const configDocRef = doc(db, 'config', 'ai-news');
    const configSnap = await getDoc(configDocRef);
    const lastFetchedAt = configSnap.exists() ? configSnap.data().lastFetchedAt?.toMillis?.() : null;

    if (lastFetchedAt && now - lastFetchedAt < FETCH_INTERVAL) {
      const snapshot = await getDocs(collection(db, 'ai-news'));
      const nowTimestamp = Timestamp.now();
      const cachedArticles = snapshot.docs
        .map((doc) => doc.data())
        .filter((article) => article.timestamp.toMillis() > nowTimestamp.toMillis() - 24 * 60 * 60 * 1000)
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

      return NextResponse.json({ articles: cachedArticles.slice(0, 50) });
    }

    const feed = await parser.parseURL(FEED_URL);
    console.log('🟡 RSS feed loaded:', feed.items?.length);
    const nowTimestamp = Timestamp.now();
    const newsCollection = collection(db, 'ai-news');

    const existingSnapshot = await getDocs(newsCollection);
    const existingData: Record<string, { timestamp: Timestamp; [key: string]: unknown }> = {};
    existingSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as { [key: string]: unknown; timestamp: Timestamp };
      if (data?.link) {
        existingData[data.link] = data;
      }
    });

    const newArticles = feed.items?.filter((item) => {
      const pubDate = new Date(item.pubDate || '');
      return !existingData[item.link] && pubDate > new Date(Date.now() - 24 * 60 * 60 * 1000);
    }) ?? [];
    console.log('🟢 Filtered new articles:', newArticles.length);

    const summarizedArticles = [...existingSnapshot.docs.map(doc => doc.data())];

    if (newArticles.length === 0) {
      await setDoc(configDocRef, { lastFetchedAt: Timestamp.now() }, { merge: true });

      return NextResponse.json({
        articles: summarizedArticles
          .filter((a) => a.timestamp.toMillis() > nowTimestamp.toMillis() - 24 * 60 * 60 * 1000)
          .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
          .slice(0, 50),
      });
    }

    for (const article of newArticles) {
      const summaryPrompt = `다음 뉴스 기사 제목과 내용을 2문장으로 요약해줘:\n\n제목: ${article.title}\n\n링크: ${article.link}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: summaryPrompt }],
        }),
      });

      const data: { choices?: { message?: { content?: string } }[] } = await response.json();
      const summary = data.choices?.[0]?.message?.content ?? '요약 실패';

      const articleData = {
        title: article.title,
        link: article.link,
        pubDate: article.pubDate,
        summary,
        timestamp: Timestamp.now(),
      };

      console.log('📝 Saving summarized article:', article.title);
      await setDoc(doc(newsCollection, encodeURIComponent(article.link)), articleData);
      summarizedArticles.push(articleData);
    }

    // Remove articles older than 24 hours
    for (const docSnap of existingSnapshot.docs) {
      const data = docSnap.data();
      if (data.timestamp.toMillis() < Timestamp.now().toMillis() - 24 * 60 * 60 * 1000) {
        await deleteDoc(doc(newsCollection, docSnap.id));
      }
    }

    // Update lastFetchedAt in Firestore
    await setDoc(configDocRef, { lastFetchedAt: Timestamp.now() }, { merge: true });

    // Return latest (max 50)
    summarizedArticles.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

    return NextResponse.json({ articles: summarizedArticles.slice(0, 50) });
  } catch (error) {
    console.error('❌ 뉴스 요약 API 실패:', error.message, error.stack);
    return NextResponse.json({ articles: [] });
  }
}