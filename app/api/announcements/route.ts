import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const pageNo = searchParams.get('page') || '1';
  const rowCount = searchParams.get('rows') || '10';

  const apiKey = process.env.NTIS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NTIS_API_KEY is not configured' }, { status: 500 });
  }

  // NTIS 또는 공공데이터포털 연계 사업공고 URL (신청하신 세부 서비스 URL에 맞게 수정)
  const targetUrl = new URL('https://api.ntis.go.kr/openapi/service/rest/RndNoticeService/getRndNoticeList');
  targetUrl.searchParams.set('serviceKey', apiKey);
  targetUrl.searchParams.set('pageNo', pageNo);
  targetUrl.searchParams.set('numOfRows', rowCount);
  if (keyword) {
    targetUrl.searchParams.set('searchKeyword', keyword);
  }

  try {
    const res = await fetch(targetUrl.toString(), {
      headers: {
        Accept: 'application/json', // JSON 미지원 엔드포인트의 경우 text() 수신 후 xml2js 파싱 필요
      },
      next: { revalidate: 3600 }, // 1시간 캐싱
    });

    if (!res.ok) {
      throw new Error(`NTIS API HTTP error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch NTIS notices' }, { status: 500 });
  }
}