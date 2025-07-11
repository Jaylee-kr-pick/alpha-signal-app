import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { NextResponse } from 'next/server';
import { db, FieldValue } from '@/firebase-admin'; // use firebase-admin here
// import { OpenAI } from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

async function analyzeStock(stock: { symbol: string; name: string; type: string }) {
  const prompt = `
    종목명: ${stock.name}
    종목코드/티커: ${stock.symbol}
    시장 구분: ${stock.type}

    너는 주식 전문 분석가야 아래 정보를 기반으로 이 종목의 종합 투자 매력도를 0~100점으로 점수화 해주세요.
    10점 단위가 아닌 1점 단위로 점수를 상세게 매겨야 해.
    - 최신 뉴스, 거래량, 기술적 분석을 고려해서 100점 만점으로 투자 매력도를 평가해줘.
    - 100점 만점 점수와 함께, 최소 200자 이상의 상세한 분석과 이유를 작성해줘.
    - 점수와 분석 내용은 분리해서 명확하게 표시해줘.
    - 점수는 반드시 숫자로만 작성하고, 분석 내용은 자연어로 작성해줘.
    - 예시: "점수: 85, 분석: 이 종목은 최근 기술적 지표가 긍정적이며, 거래량이 증가하고 있습니다. 또한, 최근 뉴스에서도 긍정적인 보도가 이어지고 있어..."
    - 전문적으로 작성해줘.
    - 반드시 정보와 데이터를 기반으로 분석해서 전문가가 작성한 것처럼 써 줘
    - 분석 내용은 주관적이지 않고 객관적인 데이터와 사실에 기반해야 해.
    - 분석 내용은 종목의 현재 상황, 시장 동향, 기술적 지표 등을 포함해야 해.
    - 분석 내용은 종목의 장단점, 리스크 요인 등을 포함해야 해.
    - 분석 내용은 종목의 미래 전망과 관련된 정보도 포함해야 해.
    - 문서는 보기 편하게 잘 정리해서 작성해 줘.
    - 분석 내용은 종목의 산업 동향, 경쟁사 분석, 재무 상태 등을 포함해야 해.
    - 문서 아웃풋은 잘 읽히도록 마크다운 형식으로 작성해 줘.
    - AI가 작성한 것처럼 보이지 않도록 전문가가 상담해 주듯이 작성해줘 ***같은 것 쓰지 않도록


  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  console.log('🟢 OpenAI 응답 전체:', JSON.stringify(response, null, 2));

  const responseText = response.choices?.[0]?.message?.content || '';
  console.log('🟢 파싱된 content:', responseText);

  const scoreMatch = responseText.match(/\d+/);
  const score = scoreMatch ? parseInt(scoreMatch[0], 10) : null;

  return {
    score,
    fullAnalysis: responseText,
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