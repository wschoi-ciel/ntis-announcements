// app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// D-day 계산기
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

// 실제 캡처 화면에 있던 최신 공고 데이터 백업 (API 연동 실패 시 빈 화면 방지용)
const FALLBACK_LIST = [
  {
    id: 77106,
    status: '접수예정',
    title: '2026년도 산업기술RD연구기획사업 신규지원대상 연구개발과제 공고',
    dept: '기후에너지환경부',
    rcptBg: '2026.09.07',
    rcptEnd: '2026.10.07',
    dday: 'D-30',
    url: 'https://www.ntis.go.kr'
  },
  {
    id: 77105,
    status: '접수중',
    title: '2028년도 산업기술 RD사업(스마트전자 분야-중전기기) 기술수요조사 공고',
    dept: '산업통상부',
    rcptBg: '2026.09.03',
    rcptEnd: '2026.09.30',
    dday: 'D-23',
    url: 'https://www.ntis.go.kr'
  },
  {
    id: 77104,
    status: '접수중',
    title: '2027년 국가기록관리 활용기술 연구개발(RD)사업 과제 수요조사',
    dept: '행정안전부',
    rcptBg: '2026.09.02',
    rcptEnd: '2026.10.02',
    dday: 'D-25',
    url: 'https://www.ntis.go.kr'
  },
  {
    id: 77103,
    status: '접수예정',
    title: '2027년도 서울지역 환경현안 해결을 위한 연구사업 과제 공모',
    dept: '기후에너지환경부',
    rcptBg: '2026.09.14',
    rcptEnd: '2026.09.14',
    dday: 'D -7',
    url: 'https://www.ntis.go.kr'
  },
  {
    id: 77102,
    status: '접수중',
    title: '2027년도 자원분야 RD사업 통합기술수요조사 공고',
    dept: '산업통상부',
    rcptBg: '2026.09.04',
    rcptEnd: '2026.09.14',
    dday: 'D -7',
    url: 'https://www.ntis.go.kr'
  },
  {
    id: 77101,
    status: '접수예정',
    title: '2026년 3차 재생에너지RD(태양광) 신규지원대상 연구개발과제 공고',
    dept: '기후에너지환경부',
    rcptBg: '2026.09.08',
    rcptEnd: '2026.10.01',
    dday: 'D-24',
    url: 'https://www.ntis.go.kr'
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const dept = searchParams.get('dept') || '전체';
  const rawKey = process.env.NTIS_API_KEY;

  // 키 미설정 시 안내 및 Fallback 반환
  if (!rawKey) {
    const list = filterNotices(FALLBACK_LIST, keyword, dept);
    return NextResponse.json({
      success: true,
      isFallback: true,
      apiError: 'NTIS_API_KEY 환경변수가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.',
      items: list,
      totalCount: 77106
    });
  }

  // 1차 시도: 실제 API 호출
  try {
    const baseUrl = process.env.NTIS_API_URL || 'https://api.ntis.go.kr/openapi/service/rest/RndNoticeService/getRndNoticeList';
    const decodedKey = decodeURIComponent(rawKey.trim());
    
    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.set('serviceKey', decodedKey);
    targetUrl.searchParams.set('pageNo', '1');
    targetUrl.searchParams.set('numOfRows', '50');
    if (keyword) targetUrl.searchParams.set('searchKeyword', keyword);
    if (dept && dept !== '전체') targetUrl.searchParams.set('deptNm', dept);

    const res = await fetch(targetUrl.toString(), {
      headers: { 'Accept': 'application/xml, text/xml, application/json, */*' },
      next: { revalidate: 180 }
    });

    const responseText = await res.text();
    let rawItems: any[] = [];
    let totalCount = 0;
    let apiErrorMsg = '';

    if (responseText.trim().startsWith('{')) {
      const json = JSON.parse(responseText);
      const body = json?.response?.body || json?.body || json;
      totalCount = Number(body?.totalCount) || 0;
      const items = body?.items?.item || body?.items || [];
      rawItems = Array.isArray(items) ? items : (items ? [items] : []);
    } else {
      const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
      const xml = parser.parse(responseText);
      
      // 공공데이터 API 에러 응답 체크 (SERVICE_KEY_IS_NOT_REGISTERED_ERROR 등)
      if (xml?.OpenAPI_ServiceResponse?.cmmMsgHeader || xml?.response?.header?.resultMsg) {
        const errMsg = xml?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg || xml?.response?.header?.resultMsg;
        if (errMsg && !errMsg.includes('NORMAL')) {
          apiErrorMsg = errMsg;
        }
      }

      const body = xml?.response?.body || xml?.body || xml;
      totalCount = Number(body?.totalCount) || 0;
      const items = body?.items?.item || body?.items || [];
      rawItems = Array.isArray(items) ? items : (items ? [items] : []);
    }

    // 실제 데이터가 파싱된 경우
    if (rawItems.length > 0) {
      const items = rawItems.map((item, idx) => {
        const title = item.ancmNm || item.pblancNm || item.title || '공고명 정보 없음';
        const deptNm = item.deptNm || item.jrsdMininsttNm || item.mngOrgNm || '부처 공통';
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
          id: item.ancmId || item.pblancId || (idx + 1),
          status,
          title,
          dept: deptNm,
          rcptBg,
          rcptEnd,
          dday,
          url: item.dtlUrl || item.dtlPageUrl || item.link || 'https://www.ntis.go.kr'
        };
      });

      const filtered = dept && dept !== '전체'
        ? items.filter(n => dept === '다부처' ? n.dept.includes('다부처') : n.dept.includes(dept))
        : items;

      return NextResponse.json({
        success: true,
        isFallback: false,
        totalCount: totalCount || filtered.length,
        items: filtered
      });
    }

    // 응답이 없거나 에러가 발생한 경우 Fallback 데이터로 화면 유지
    const list = filterNotices(FALLBACK_LIST, keyword, dept);
    return NextResponse.json({
      success: true,
      isFallback: true,
      apiError: apiErrorMsg || `API 응답에 공고 데이터가 없습니다. (원문: ${responseText.slice(0, 100)}...)`,
      items: list,
      totalCount: 77106
    });

  } catch (err: any) {
    const list = filterNotices(FALLBACK_LIST, keyword, dept);
    return NextResponse.json({
      success: true,
      isFallback: true,
      apiError: `API 통신 예외: ${err.message}`,
      items: list,
      totalCount: 77106
    });
  }
}

function filterNotices(list: typeof FALLBACK_LIST, keyword: string, dept: string) {
  return list.filter(item => {
    const matchDept = !dept || dept === '전체' || (dept === '다부처' ? item.dept.includes('다부처') : item.dept === dept);
    const matchKw = !keyword || item.title.includes(keyword);
    return matchDept && matchKw;
  });
}