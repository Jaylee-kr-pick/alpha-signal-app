import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.KIS_APPKEY!;
const CLIENT_SECRET = process.env.KIS_APPSECRET!;

export async function GET() {
  const res = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: CLIENT_ID,
      appsecret: CLIENT_SECRET,
      scope: 'oob',
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}