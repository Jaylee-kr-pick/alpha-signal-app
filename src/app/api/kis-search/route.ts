// src/app/api/kis-search/route.ts
import fs from 'fs';
import path from 'path';

const CLIENT_ID = process.env.KIS_APPKEY!;
const CLIENT_SECRET = process.env.KIS_APPSECRET!;
const BASE_URL = 'https://openapi.koreainvestment.com:9443';
const TOKEN_FILE = path.join(process.cwd(), 'kis-token.json');

// 🔐 토큰 로드
function loadToken(): { token: string; expiresAt: number } | null {
  if (!fs.existsSync(TOKEN_FILE)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    return data;
  } catch {
    return null;
  }
}

// 💾 토큰 저장
function saveToken(token: string, expiresIn: number) {
  const expiresAt = Date.now() + (expiresIn - 60) * 1000; // 1분 여유
  const data = { token, expiresAt };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(data));
}

// 🧠 토큰 가져오기 (캐시 + 재발급)
async function getAccessToken(): Promise<string> {
  const cached = loadToken();
  const now = Date.now();

  if (cached && now < cached.expiresAt) {
    return cached.token;
  }

  const res = await fetch(`${BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: CLIENT_ID,
      appsecret: CLIENT_SECRET,
      scope: 'oob',
    }),
  });

  const data = (await res.json()) as { access_token: string; expires_in: number };
  saveToken(data.access_token, data.expires_in);
  return data.access_token;
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  try {
    const token = await getAccessToken();

    const url = `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-search?contextMenuType=stock&searchname=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${token}`,
        'appkey': CLIENT_ID,
        'appsecret': CLIENT_SECRET,
        'tr_id': 'FHKST01010100',
      },
      cache: 'no-store',
    });

    const raw = await res.json();
    const items = (raw as { output?: { hts_kor_isnm: string; research_stock_code: string }[] }).output || [];

    const results = items.map((item) => ({
      name: item.hts_kor_isnm,
      code: item.research_stock_code,
    }));

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('❌ 종목 검색 실패:', err);
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}