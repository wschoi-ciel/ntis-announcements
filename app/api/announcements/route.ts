// app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

function calculateDday(endDateStr?: string) {
  if (!endDateStr) return '-';
  const clean = String(endDateStr).replace(/[^0-9]/g, '');
  if (clean.length < 8) return '-';

  const year = parseInt(clean.substring(0, 4), 10);
  const month = parseInt(clean.substring(4, 6), 10) - 1;
  const day = parseInt(clean.substring(6, 8), 10);

  const targetDate = new Date(year, month, day);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '마감';
  if (diffDays === 0) return 'D-Day';
  return `D-${diffDays}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  const clean = String(dateStr).replace(/[^0-9]/g, '');
  if (clean.length === 8) {
    return `${clean.substring(0, 4)}.${clean.substring(4, 6)}.${clean.substring(6, 8)}`;
  }
  return String(dateStr);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const dept = searchParams.get('dept') || '전체';
  const page = searchParams.get('page') || '1';
  const rows = searchParams.get('rows') || '20';

  const rawKey = process.env.NTIS_API_KEY;
  if (!rawKey) {
    return NextResponse.json({
      success: false,
      message: 'NTIS_API_KEY 환경변수가 설정되지 않았습니다. .env.local 또는 Vercel 설정을 확인해주세요.',
      items: [],
      totalCount: 0
    });
  }

  // 인코딩/디코딩 이슈 방지: 디코딩 후 URLSearchParams가 한 번만 인코딩하도록 함
  const serviceKey = decodeURIComponent(rawKey.trim());
  const baseUrl = process.env.NTIS_API_URL || 'https://api.ntis.go.kr/openapi/service/rest/RndNoticeService/getRndNoticeList';

  try {
    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.set('serviceKey', serviceKey);
    targetUrl.searchParams.set('pageNo', page);
    targetUrl.searchParams.set('numOfRows', rows);

    if (keyword) {
      targetUrl.searchParams.set('searchKeyword', keyword);
    }
    if (dept && dept !== '전체') {
      targetUrl.searchParams.set('deptNm', dept);
    }

    const res = await fetch(targetUrl.toString(), {
      headers: {
        'Accept': 'application/xml, text/xml, application/json, */*'
      },
      next: { revalidate: 300 } // 5분 캐시
    });

    const responseText = await res.text();
    let rawItems: any[] = [];
    let totalCount = 0;

    if (responseText.trim().startsWith('{')) {
      const json = JSON.parse(responseText);
      const body = json?.response?.body || json?.body || json;
      totalCount = Number(body?.totalCount) || 0;
      const items = body?.items?.item || body?.items || [];
      rawItems = Array.isArray(items) ? items : (items ? [items] : []);
    } else {
      const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
      const xml = parser.parse(responseText);
      const body = xml?.response?.body || xml?.body || xml;
      totalCount = Number(body?.totalCount) || 0;
      const items = body?.items?.item || body?.items || [];
      rawItems = Array.isArray(items) ? items : (items ? [items] : []);
    }

    const notices = rawItems.filter(Boolean).map((item, idx) => {
      const title = item.ancmNm || item.pblancNm || item.taskNm || item.title || '과제 공고명 정보 없음';
      const deptNm = item.deptNm || item.jrsdMininsttNm || item.mngOrgNm || item.ministry || '부처 공통';
      const rcptBg = formatDate(item.rcptBgDt || item.rcptBgnDe || item.startDate || '');
      const rcptEnd = formatDate(item.rcptEndDt || item.rcptEndDe || item.endDate || '');
      const dday = calculateDday(item.rcptEndDt || item.rcptEndDe || item.endDate);

      let status = item.status || item.ancmStatusNm || '';
      if (!status) {
        if (dday === '마감') status = '마감';
        else if (item.rcptBgDt && new Date(formatDate(item.rcptBgDt)).getTime() > Date.now()) status = '접수예정';
        else status = '접수중';
      }

      return {
        id: item.ancmId || item.pblancId || (parseInt(page) - 1) * parseInt(rows) + (idx + 1),
        status,
        title,
        dept: deptNm,
        rcptBg,
        rcptEnd,
        dday,
        url: item.dtlUrl || item.dtlPageUrl || item.link || ''
      };
    });

    // API 파라미터가 부처 필터링을 직접 지원하지 않는 경우를 대비한 2차 필터링
    const finalItems = dept && dept !== '전체'
      ? notices.filter(n => dept === '다부처' ? n.dept.includes('다부처') : n.dept.includes(dept))
      : notices;

    return NextResponse.json({
      success: true,
      totalCount: totalCount || finalItems.length,
      items: finalItems
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
      items: [],
      totalCount: 0
    }, { status: 500 });
  }
}