import { db } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let cachedToken: string | null = null;
let cachedTime: number | null = null;

export async function getKisAccessToken(): Promise<string> {
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  if (cachedToken && cachedTime && now - cachedTime < TWENTY_FOUR_HOURS) {
    return cachedToken;
  }

  const docRef = doc(db, 'kis-token', 'current');
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const { access_token, timestamp } = snapshot.data();
    if (now - timestamp < TWENTY_FOUR_HOURS) {
      cachedToken = access_token;
      cachedTime = timestamp;
      return access_token;
    }
  }

  console.log('🔑 Requesting KIS token with appkey:', process.env.KIS_APPKEY);
  const response = await fetch('https://openapi.koreainvestment.com:9443/oauth2/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      appkey: process.env.KIS_APPKEY!,
      appsecret: process.env.KIS_APPSECRET!,
    }),
  });

  const data = await response.json();
  console.log('📩 KIS token response:', data);

  if (!response.ok) {
    throw new Error(`Failed to obtain token: ${JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  cachedTime = now;

  await setDoc(docRef, {
    access_token: data.access_token,
    timestamp: now,
  });

  return data.access_token;
}