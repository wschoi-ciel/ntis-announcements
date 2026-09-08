// app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';

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

  const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return '마감';
  if (diffDays === 0) return 'D-Day';
  return `D-${diffDays}`;
}

function cleanUrlString(raw?: string): string {
  if (!raw) return 'https://api.ntis.go.kr/openapi/service/rest/RndPblancService/getRndPblancList';
  const trimmed = raw.trim();
  const match = trimmed.match(/https?:\/\/[^\s)\]]+/);
  return match ? match[0] : trimmed;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const size = parseInt(searchParams.get('size') || '20', 10);
  const dept = searchParams.get('dept') || '전체';
  const status = searchParams.get('status') || '전체';
  const time = searchParams.get('time') || 'all';
  const keyword = searchParams.get('keyword') || '';

  const rawKey = (process.env.NTIS_API_KEY || process.env.NEXT_PUBLIC_NTIS_API_KEY || '').trim();
  const cleanedUrl = cleanUrlString(process.env.NTIS_API_URL || process.env.NEXT_PUBLIC_NTIS_API_URL);

  if (!rawKey) {
    return NextResponse.json({
      success: false,
      items: [],
      totalCount: 0,
      message: 'NTIS_API_KEY 환경변수가 설정되지 않았습니다. Vercel 설정을 확인해주세요.'
    });
  }

  let itemsFromApi: any[] = [];
  let apiTotalCount = 0;
  let rawResponsePreview = '';

  try {
    const targetUrl = new URL(cleanedUrl);
    
    // NTIS 공식 API 표준 필수 파라미터
    targetUrl.searchParams.set('apiKey', rawKey);
    targetUrl.searchParams.set('serviceKey', decodeURIComponent(rawKey));
    targetUrl.searchParams.set('pageNo', String(page));
    targetUrl.searchParams.set('numOfRows', String(size));

    // 검색 키워드가 있는 경우 매핑
    if (keyword.trim()) {
      targetUrl.searchParams.set('pblancNm', keyword.trim());
      targetUrl.searchParams.set('searchKeyword', keyword.trim());
    }

    // 부처 파라미터 매핑
    if (dept !== '전체' && dept !== '다부처') {
      targetUrl.searchParams.set('jrsdMinisNm', dept);
      targetUrl.searchParams.set('deptNm', dept);
    }

    const res = await fetch(targetUrl.toString(), {
      headers: {
        'Accept': 'application/xml, application/json, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      cache: 'no-store'
    });

    const responseText = await res.text();
    rawResponsePreview = responseText.slice(0, 300);

    // 1. JSON 응답 처리
    if (responseText.trim().startsWith('{')) {
      const json = JSON.parse(responseText);
      const body = json?.response?.body || json?.body || json;
      apiTotalCount = Number(body?.totalCount) || 0;
      const rawItems = body?.items?.item || body?.items || [];
      itemsFromApi = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);
    } else {
      // 2. XML 응답 처리 (NTIS 표준 <item> 블록 파싱)
      const matches = responseText.match(/<item>([\s\S]*?)<\/item>/g) || [];
      const totalMatch = responseText.match(/<totalCount>(\d+)<\/totalCount>/);
      apiTotalCount = totalMatch ? parseInt(totalMatch[1], 10) : matches.length;

      itemsFromApi = matches.map(m => {
        const getTag = (tag: string) => {
          const match = m.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
          return match ? match[1].trim() : '';
        };

        return {
          ancmId: getTag('ancmId') || getTag('pblancId') || getTag('roRndUid'),
          ancmNm: getTag('ancmNm') || getTag('pblancNm') || getTag('title'),
          deptNm: getTag('deptNm') || getTag('jrsdMinisNm') || getTag('orderInsttNm'),
          rcptBgDt: getTag('rcptBgDt') || getTag('rceptBgnde') || getTag('pblancYmd'),
          rcptEndDt: getTag('rcptEndDt') || getTag('rceptEndde') || getTag('rceptCloYmd'),
          mngOrgNm: getTag('mngOrgNm') || getTag('excInsttNm') || getTag('manageInsttNm'),
          dtlUrl: getTag('dtlUrl') || getTag('pblancUrl') || getTag('linkUrl'),
          budget: getTag('budget') || getTag('totRndAmt'),
          inqTel: getTag('inqTel') || getTag('inquiryTelno'),
          pblancClsfNm: getTag('pblancClsfNm') || '일반공고'
        };
      });
    }

    if (itemsFromApi.length > 0) {
      const mapped = itemsFromApi.map((item: any, idx: number) => {
        const rawBg = item.rcptBgDt ? String(item.rcptBgDt).replace(/[^0-9]/g, '') : '';
        const rawEnd = item.rcptEndDt ? String(item.rcptEndDt).replace(/[^0-9]/g, '') : '';

        const bg = rawBg.length >= 8 ? rawBg.replace(/(\d{4})(\d{2})(\d{2}).*/, '$1.$2.$3') : '-';
        const end = rawEnd.length >= 8 ? rawEnd.replace(/(\d{4})(\d{2})(\d{2}).*/, '$1.$2.$3') : '-';
        const dday = calculateDday(rawEnd);
        const computedStatus = dday === '마감' ? '마감' : '접수중';
        const title = item.ancmNm || item.pblancNm || '공고 정보 없음';
        const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();

        const irisUrl = item.dtlUrl && item.dtlUrl.includes('iris.go.kr')
          ? item.dtlUrl
          : `https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${encodeURIComponent(cleanTitle || title)}`;

        return {
          id: item.ancmId || `${page}-${idx + 1}`,
          status: computedStatus,
          title,
          dept: item.deptNm || '부처 공통',
          rcptBg: bg,
          rcptEnd: end,
          dday,
          noticeType: item.pblancClsfNm || '일반공고',
          agency: item.mngOrgNm || '전문관리기관',
          noticeDate: bg,
          rcptEndTime: '18:00',
          noticeCategory: '본공고',
          budget: item.budget ? `${item.budget} 억원` : '공고문 참조',
          contact: item.inqTel || '1357',
          projectName: title,
          files: ['공고문 및 제안요청서.pdf'],
          content: '본 공고의 세부 지원내용 및 제안요청서는 공식 IRIS 사업공고 시스템을 확인하시기 바랍니다.',
          irisDirectUrl: irisUrl
        };
      });

      let filtered = mapped;
      if (dept !== '전체') {
        const cleanDept = dept.replace(/(부|청|처|위원회|자원부|통상부)/g, '');
        filtered = filtered.filter(n => n.dept.includes(cleanDept));
      }
      if (status !== '전체') {
        filtered = filtered.filter(n => n.status === status);
      }
      if (time === '6m') {
        filtered = filtered.filter(n => n.rcptBg >= '2026.03.01');
      }

      return NextResponse.json({
        success: true,
        items: filtered,
        totalCount: apiTotalCount || filtered.length
      });
    }

    // itemsFromApi가 0건인 경우 응답 상태 전달
    return NextResponse.json({
      success: true,
      items: [],
      totalCount: 0,
      message: `NTIS API가 빈 결과를 반환했습니다. [응답 요약: ${rawResponsePreview.replace(/<[^>]*>/g, ' ').slice(0, 100)}]`
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      items: [],
      totalCount: 0,
      message: `API 호출 예외: ${error?.message || ''}`
    });
  }
}