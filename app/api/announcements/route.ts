// app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// D-day 계산 보조 함수
function getDday(endStr?: string) {
  if (!endStr) return '-';
  const clean = endStr.replace(/[^0-9]/g, '');
  if (clean.length < 8) return '-';
  const end = new Date(
    parseInt(clean.substring(0, 4), 10),
    parseInt(clean.substring(4, 6), 10) - 1,
    parseInt(clean.substring(6, 8), 10)
  );
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '마감';
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

// 날짜 포맷 (YYYY.MM.DD)
function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  const clean = dateStr.replace(/[^0-9]/g, '');
  if (clean.length === 8) {
    return `${clean.substring(0, 4)}.${clean.substring(4, 6)}.${clean.substring(6, 8)}`;
  }
  return dateStr;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const dept = searchParams.get('dept') || '';
  const pageNo = searchParams.get('page') || '1';
  const numOfRows = searchParams.get('rows') || '20';

  const rawKey = process.env.NTIS_API_KEY;
  if (!rawKey) {
    return NextResponse.json({
      success: false,
      message: 'NTIS_API_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수를 확인해주세요.',
      items: [],
      totalCount: 0
    });
  }

  // 공공데이터 특유의 인코딩 이중 escape 방지 처리
  const serviceKey = decodeURIComponent(rawKey.trim());
  const baseUrl = process.env.NTIS_API_URL || 'https://api.ntis.go.kr/openapi/service/rest/RndNoticeService/getRndNoticeList';

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('serviceKey', serviceKey);
    url.searchParams.set('pageNo', pageNo);
    url.searchParams.set('numOfRows', numOfRows);

    if (keyword) {
      url.searchParams.set('searchKeyword', keyword);
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/xml, text/xml, application/json, */*'
      },
      next: { revalidate: 600 } // 10분 캐시
    });

    const responseText = await res.text();
    let rawItems: any[] = [];
    let totalCount = 0;

    // 1. JSON 응답인 경우
    if (responseText.trim().startsWith('{')) {
      const json = JSON.parse(responseText);
      const body = json?.response?.body || json?.body || json;
      totalCount = Number(body?.totalCount) || 0;
      const items = body?.items?.item || body?.items || [];
      rawItems = Array.isArray(items) ? items : [items];
    } 
    // 2. XML 응답인 경우 (NTIS 기본)
    else {
      const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
      const xml = parser.parse(responseText);
      const body = xml?.response?.body || xml?.body || xml;
      totalCount = Number(body?.totalCount) || 0;
      const items = body?.items?.item || body?.items || [];
      rawItems = Array.isArray(items) ? items : [items];
    }

    // NTIS 다양한 필드명 호환 매핑
    const notices = rawItems.filter(Boolean).map((item, index) => {
      const title = item.ancmNm || item.pblancNm || item.title || '공고명 정보 없음';
      const deptNm = item.deptNm || item.jrsdMininsttNm || item.mngOrgNm || item.ministry || '부처 공통';
      const rcptBg = formatDate(item.rcptBgDt || item.rcptBgnDe || item.startDate || '');
      const rcptEnd = formatDate(item.rcptEndDt || item.rcptEndDe || item.endDate || '');
      const dday = getDday(item.rcptEndDt || item.rcptEndDe || item.endDate);

      // 접수 상태 판별
      let status = item.status || item.ancmStatusNm || '';
      if (!status) {
        if (dday === '마감') status = '마감';
        else status = '접수중';
      }

      return {
        id: item.ancmId || item.pblancId || item.id || (index + 1),
        title,
        dept: deptNm,
        rcptBg,
        rcptEnd,
        status,
        dday,
        url: item.dtlUrl || item.dtlPageUrl || item.link || ''
      };
    });

    // 부처 필터링 적용 (API 자체 파라미터 미지원 시 서버 사이드 필터링)
    const filtered = dept && dept !== '전체'
      ? notices.filter(n => dept === '다부처' ? n.dept.includes('다부처') : n.dept.includes(dept))
      : notices;

    return NextResponse.json({
      success: true,
      totalCount: totalCount || filtered.length,
      items: filtered
    });

  } catch (error: any) {
    console.error('NTIS API Fetch Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      items: [],
      totalCount: 0
    }, { status: 500 });
  }
}