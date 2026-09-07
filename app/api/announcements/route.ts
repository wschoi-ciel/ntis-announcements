import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const dept = searchParams.get('dept') || '';

  const apiKey = process.env.NTIS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NTIS_API_KEY is not configured' }, { status: 500 });
  }

  // 발급받으신 NTIS 오픈API 엔드포인트 URL
  const targetUrl = new URL('https://api.ntis.go.kr/openapi/service/rest/RndNoticeService/getRndNoticeList');
  targetUrl.searchParams.set('serviceKey', apiKey);
  targetUrl.searchParams.set('numOfRows', '100'); // 충분한 건수를 한 번에 조회
  targetUrl.searchParams.set('pageNo', '1');

  if (keyword) targetUrl.searchParams.set('searchKeyword', keyword);
  if (dept && dept !== '전체') targetUrl.searchParams.set('deptNm', dept);

  try {
    const res = await fetch(targetUrl.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 1800 }, // 30분 캐시
    });

    if (!res.ok) {
      throw new Error(`NTIS API Error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}