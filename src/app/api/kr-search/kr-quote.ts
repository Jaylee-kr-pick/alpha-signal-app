import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const db = getFirestore();

export async function getToken() {
  const ref = doc(db, 'kis-token', 'current');
  const snap = await getDoc(ref);
  const now = Date.now();

  if (snap.exists()) {
    const { token, timestamp } = snap.data();
    if (now - timestamp < 1000 * 60 * 60 * 24) {
      return token;
    }
  }

  const res = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: process.env.KIS_APPKEY,
      appsecret: process.env.KIS_APPSECRET
    })
  });

  const data = await res.json();
  const token = data.access_token;

  await setDoc(ref, {
    token,
    timestamp: now
  });

  return token;
}
export async function getRealtimeQuote(stockCode: string) {
  const token = await getToken();

  // KRX 종목코드 형식에 맞춰서 앞에 'A' 추가
  // 예: 005930 → A005930
  // 'custtype'은 개인: 'P', 법인: 'B'
  const url = new URL('https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price');
  url.searchParams.append('fid_cond_mrkt_div_code', 'J'); // 주식 시장 구분: J = 코스피/코스닥
  url.searchParams.append('fid_input_iscd', `A${stockCode}`);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`,
      'appkey': process.env.KIS_APPKEY!,
      'appsecret': process.env.KIS_APPSECRET!,
      'tr_id': 'FHKST01010100',
      'custtype': 'P'
    }
  });

  const data = await res.json();
  return data;
}

export async function searchStockByName(query: string) {
  const token = await getToken();

  const url = new URL('https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/search-stock-info');
  url.searchParams.append('query', query);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`,
      'appkey': process.env.KIS_APPKEY!,
      'appsecret': process.env.KIS_APPSECRET!,
      'tr_id': 'CTPF1604R',
      'custtype': 'P'
    }
  });

  const data = await res.json();
  return data;
}