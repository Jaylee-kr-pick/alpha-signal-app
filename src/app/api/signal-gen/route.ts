import { NextResponse } from 'next/server';
import { db, FieldValue } from '@/firebase-admin'; // use firebase-admin here
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeStock(stock: { symbol: string; name: string; type: string }) {
  const prompt = `
    종목명: ${stock.name}
    종목코드/티커: ${stock.symbol}
    시장 구분: ${stock.type}

    아래 정보를 기반으로 이 종목의 종합 투자 매력도를 0~100점으로 점수화 해주세요.
    1. 최근 뉴스 이슈
    2. 거래량 변동
    3. 기술적 분석 (차트 패턴, 지지선/저항선)
    4. 종목의 펀더멘털 간략 평가
    
    점수만 숫자로 대답해주세요.
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const response = completion.choices[0]?.message.content || '';
  console.log('🟢 OpenAI 응답 전체:', JSON.stringify(completion, null, 2));
  console.log('🟢 파싱된 content:', response);
  const scoreMatch = response.match(/\d+/);
  const score = scoreMatch ? parseInt(scoreMatch[0], 10) : null;

  return {
    score,
    fullAnalysis: response,
  };
}

export async function GET() {
  try {
    console.log('🔥 API /api/signal-gen 호출 시작');
    const usersSnapshot = await db.collection('user').get();
    console.log('🟢 유저 수:', usersSnapshot.size);
    const collections = await db.listCollections();
    console.log('🔥 DB에 존재하는 컬렉션 목록:');
    collections.forEach((col) => {
      console.log(`📚 컬렉션 이름: ${col.id}`);
    });

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const plan = userDoc.data().plan || 'free';

      const limitMap: { [key: string]: number } = {
        free: 1,
        basic: 5,
        pro: 20,
      };
      const maxAlerts = limitMap[plan] || 1;

      const stockCollections = [
        'watchlist_ko_stocks',
        'watchlist_global_stocks',
        'watchlist_crypto_stocks',
      ];

      const watchlist: { symbol: string; name: string; type: string }[] = [];

      for (const col of stockCollections) {
        console.log('🟢 지금 조회하는 유저 ID:', userId);
        console.log('🟢 지금 조회하는 컬렉션 이름:', col);
        const stockSnapshot = await db
          .collection('user')
          .doc(userId)
          .collection(col)
          .where('alert', '==', true)
          .get();

        stockSnapshot.forEach((doc) => {
          watchlist.push(doc.data() as { symbol: string; name: string; type: string });
        });
      }

      const targets = watchlist.slice(0, maxAlerts);
      console.log('🟢 전체 watchlist:', watchlist);
      console.log('🟢 타겟 대상:', targets);

      for (const stock of targets) {
        const { score, fullAnalysis } = await analyzeStock(stock);

        if (score === null) continue;

        const signalData = {
          uid: userId,
          symbol: stock.symbol,
          name: stock.name,
          type: stock.type,
          score,
          analysis: fullAnalysis,
          createdAt: FieldValue.serverTimestamp(),
        };

        await db
          .collection('user')
          .doc(userId)
          .collection('signals')
          .add(signalData);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ 시그널 생성 실패:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } else {
      console.error('❌ 시그널 생성 실패: 알 수 없는 에러', error);
      return NextResponse.json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
  }
}