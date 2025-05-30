import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query) return NextResponse.json({ output: [] });

  try {
    const { data, error } = await supabase
      .from('kr_stocks')
      .select('name, stock_code')
      .ilike('name', `%${query}%`)
      .limit(20);

    if (error) {
      console.error('❌ Supabase 검색 실패:', error.message);
      return NextResponse.json({ output: [] }, { status: 500 });
    }

    // ✅ 6자리 숫자 stock_code만 필터링
    const filteredData = (data || []).filter(item => /^\d{6}$/.test(item.stock_code));

    return NextResponse.json({
      output: filteredData.map(item => ({
        name: item.name,
        code: item.stock_code,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ 서버 에러:', error.message);
      return NextResponse.json({ output: [] }, { status: 500 });
    } else {
      console.error('❌ 서버 에러: 알 수 없는 에러', error);
      return NextResponse.json({ output: [] }, { status: 500 });
    }
  }
}