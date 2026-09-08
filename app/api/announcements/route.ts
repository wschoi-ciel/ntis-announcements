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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const size = searchParams.get('size') || '20';
  const dept = searchParams.get('dept') || '전체';
  const status = searchParams.get('status') || '전체';
  const time = searchParams.get('time') || 'all'; // all: 2년치 (2025~2026), 6m: 최근 6개월
  const keyword = searchParams.get('keyword') || '';

  // 환경변수 읽기 (URL이 없으면 NTIS 공식 OpenAPI 엔드포인트를 기본값으로 자동 설정)
  const rawKey = process.env.NTIS_API_KEY || process.env.NEXT_PUBLIC_NTIS_API_KEY;
  const targetApiUrl = process.env.NTIS_API_URL || 
                       process.env.NEXT_PUBLIC_NTIS_API_URL || 
                       'https://api.ntis.go.kr/openapi/service/rest/RndPblancService/getRndPblancList';

  if (!rawKey) {
    return NextResponse.json({
      success: false,
      items: [],
      totalCount: 0,
      message: 'NTIS_API_KEY 환경변수가 설정되지 않았습니다. Vercel 설정을 확인해주세요.'
    });
  }

  try {
    const url = new URL(targetApiUrl);
    
    // NTIS 및 공공데이터포털 표준 파라미터 매핑
    url.searchParams.set('serviceKey', decodeURIComponent(rawKey.trim()));
    url.searchParams.set('apiKey', rawKey.trim()); // NTIS 전용 파라미터
    url.searchParams.set('pageNo', page);
    url.searchParams.set('numOfRows', size);
    
    // 2년치 조회 기준 (2025년 1월 1일 ~ 현재 2026년)
    url.searchParams.set('bgngYmd', '20250101');
    url.searchParams.set('rcptBgDt', '20250101');

    if (keyword.trim()) {
      url.searchParams.set('searchKeyword', keyword.trim());
      url.searchParams.set('pblancNm', keyword.trim());
    }

    // 부처 필터 전달
    if (dept !== '전체' && dept !== '다부처') {
      url.searchParams.set('deptNm', dept);
    }

    const res = await fetch(url.toString(), {
      headers: { 
        'Accept': 'application/json, application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      cache: 'no-store'
    });

    const responseText = await res.text();
    let totalCount = 0;
    let rawList: any[] = [];

    // JSON 응답 파싱 시도
    if (responseText.trim().startsWith('{')) {
      const json = JSON.parse(responseText);
      const body = json?.response?.body || json?.body || json;
      totalCount = Number(body?.totalCount) || 0;
      const items = body?.items?.item || body?.items || [];
      rawList = Array.isArray(items) ? items : (items ? [items] : []);
    } else {
      // XML 응답 파싱 (공공데이터/NTIS 표준 XML)
      const matches = responseText.match(/<item>([\s\S]*?)<\/item>/g) || [];
      const totalMatch = responseText.match(/<totalCount>(\d+)<\/totalCount>/);
      totalCount = totalMatch ? parseInt(totalMatch[1], 10) : matches.length;

      rawList = matches.map(m => {
        const getTag = (tag: string) => {
          const match = m.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
          return match ? match[1].trim() : '';
        };
        return {
          ancmId: getTag('ancmId') || getTag('pblancId'),
          ancmNm: getTag('ancmNm') || getTag('pblancNm'),
          deptNm: getTag('deptNm') || getTag('jrsdMinisNm'),
          rcptBgDt: getTag('rcptBgDt') || getTag('rceptBgnde'),
          rcptEndDt: getTag('rcptEndDt') || getTag('rceptEndde'),
          mngOrgNm: getTag('mngOrgNm') || getTag('excInsttNm'),
          dtlUrl: getTag('dtlUrl') || getTag('pblancUrl'),
          budget: getTag('budget') || getTag('totRndAmt'),
          inqTel: getTag('inqTel') || getTag('inquiryTelno'),
          pblancClsfNm: getTag('pblancClsfNm')
        };
      });
    }

    // 결과 매핑
    const mapped = rawList.map((item: any, idx: number) => {
      const bg = item.rcptBgDt ? String(item.rcptBgDt).replace(/[^0-9]/g, '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
      const end = item.rcptEndDt ? String(item.rcptEndDt).replace(/[^0-9]/g, '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
      const dday = calculateDday(item.rcptEndDt);
      const computedStatus = dday === '마감' ? '마감' : (item.status || '접수중');
      const title = item.ancmNm || item.pblancNm || '공고명 정보 없음';

      // IRIS 실제 연동 URL
      const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
      const irisLink = item.dtlUrl || `https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${encodeURIComponent(cleanTitle || title)}`;

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
        content: '세부 연구목표, 자격요건 및 서식은 공고 링크에서 확인하실 수 있습니다.',
        irisDirectUrl: irisLink
      };
    });

    // 조건 필터링 (부처, 상태, 최근 6개월)
    let filtered = mapped;
    if (dept !== '전체') {
      const cleanDept = dept.replace(/(부|청|처|위원회|자원부|통상부)/g, '');
      filtered = filtered.filter(n => n.dept.includes(cleanDept));
    }
    if (status !== '전체') {
      filtered = filtered.filter(n => n.status === status);
    }
    if (time === '6m') {
      // 2026년 기준 6개월 전(2026.03.01 이후)
      filtered = filtered.filter(n => n.rcptBg >= '2026.03.01');
    }

    return NextResponse.json({
      success: true,
      items: filtered,
      totalCount: totalCount || filtered.length
    });

  } catch (error: any) {
    console.error('NTIS Live Fetch Error:', error);
    return NextResponse.json({
      success: false,
      items: [],
      totalCount: 0,
      message: `공고 조회 중 통신 오류가 발생했습니다: ${error?.message || ''}`
    });
  }
}