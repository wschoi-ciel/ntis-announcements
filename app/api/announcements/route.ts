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
  const page = parseInt(searchParams.get('page') || '1', 10);
  const size = parseInt(searchParams.get('size') || '20', 10);
  const dept = searchParams.get('dept') || '전체';
  const status = searchParams.get('status') || '전체';
  const time = searchParams.get('time') || 'all'; // all: 2년치(2025~2026), 6m: 최근 6개월
  const keyword = searchParams.get('keyword') || '';

  const rawKey = process.env.NTIS_API_KEY || process.env.NEXT_PUBLIC_NTIS_API_KEY;
  const customUrl = process.env.NTIS_API_URL || process.env.NEXT_PUBLIC_NTIS_API_URL;

  let rawApiResponse = '';
  let apiSuccess = false;
  let itemsFromApi: any[] = [];
  let apiTotalCount = 0;

  // 1. 등록된 API URL과 Key로 실제 호출 시도
  if (customUrl && rawKey) {
    try {
      const targetUrl = new URL(customUrl);
      targetUrl.searchParams.set('serviceKey', decodeURIComponent(rawKey.trim()));
      targetUrl.searchParams.set('apiKey', rawKey.trim());
      targetUrl.searchParams.set('pageNo', String(page));
      targetUrl.searchParams.set('numOfRows', String(size));

      // 2년치(20250101~) 및 주요 파라미터 규격 지원
      targetUrl.searchParams.set('bgngYmd', '20250101');
      targetUrl.searchParams.set('rceptBgnde', '20250101');
      if (keyword.trim()) targetUrl.searchParams.set('searchKeyword', keyword.trim());
      if (dept !== '전체' && dept !== '다부처') targetUrl.searchParams.set('deptNm', dept);

      const res = await fetch(targetUrl.toString(), {
        headers: {
          'Accept': 'application/json, application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        cache: 'no-store'
      });

      rawApiResponse = await res.text();

      // JSON 파싱 시도
      if (rawApiResponse.trim().startsWith('{')) {
        const json = JSON.parse(rawApiResponse);
        const body = json?.response?.body || json?.body || json;
        apiTotalCount = Number(body?.totalCount) || 0;
        const rawItems = body?.items?.item || body?.items || [];
        itemsFromApi = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);
        if (itemsFromApi.length > 0) apiSuccess = true;
      } else {
        // XML 파싱 시도
        const matches = rawApiResponse.match(/<item>([\s\S]*?)<\/item>/g) || [];
        const totalMatch = rawApiResponse.match(/<totalCount>(\d+)<\/totalCount>/);
        apiTotalCount = totalMatch ? parseInt(totalMatch[1], 10) : matches.length;

        if (matches.length > 0) {
          itemsFromApi = matches.map(m => {
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
          apiSuccess = true;
        }
      }
    } catch (e: any) {
      console.error('API Fetch Failed:', e);
      rawApiResponse = e?.message || '네트워크 통신 오류';
    }
  }

  // 2. API가 성공하여 실제 데이터가 반환된 경우
  if (apiSuccess && itemsFromApi.length > 0) {
    const mapped = itemsFromApi.map((item: any, idx: number) => {
      const bg = item.rcptBgDt ? String(item.rcptBgDt).replace(/[^0-9]/g, '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
      const end = item.rcptEndDt ? String(item.rcptEndDt).replace(/[^0-9]/g, '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
      const dday = calculateDday(item.rcptEndDt);
      const computedStatus = dday === '마감' ? '마감' : (item.status || '접수중');
      const title = item.ancmNm || item.pblancNm || '공고 정보 없음';
      const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();

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
        content: '본 사업공고의 상세 신청자격 및 제안요청서는 공식 IRIS 시스템을 확인하시기 바랍니다.',
        irisDirectUrl: item.dtlUrl || `https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${encodeURIComponent(cleanTitle || title)}`
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
      totalCount: filtered.length
    });
  }

  // 3. API 호출 실패 또는 IP 차단 시 진단 메시지 반환
  // 등록된 IP와 Vercel 클라우드 IP 불일치 문제 안내
  const isIpRestricted = rawApiResponse.includes('IP') || rawApiResponse.includes('권한') || rawApiResponse.includes('403') || !customUrl;

  return NextResponse.json({
    success: false,
    items: [],
    totalCount: 0,
    message: isIpRestricted
      ? 'NTIS API 키의 등록 IP(1.217.108.124)와 Vercel 서버 IP가 불일치하여 차단되었습니다. 공공데이터포털(data.go.kr) 일반 인증키를 사용하거나 엔드포인트 응답을 확인해야 합니다.'
      : (rawApiResponse.slice(0, 150) || 'API 응답 결과가 0건입니다.')
  });
}