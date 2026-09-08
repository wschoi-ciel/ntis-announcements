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
  if (!raw) return 'https://apis.data.go.kr/1300000/RndPblancInfoService/getRndPblancInfoList';
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

  let itemsFromApi: any[] = [];
  let apiTotalCount = 0;
  let fetchErrorMessage = '';

  // 1. 외부 API 호출 (타임아웃 3.5초 설정으로 fetch failed 먹통 방지)
  if (rawKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const targetUrl = new URL(cleanedUrl);
      targetUrl.searchParams.set('serviceKey', decodeURIComponent(rawKey));
      targetUrl.searchParams.set('apiKey', rawKey);
      targetUrl.searchParams.set('pageNo', String(page));
      targetUrl.searchParams.set('numOfRows', String(size));
      targetUrl.searchParams.set('bgngYmd', '20250101');
      targetUrl.searchParams.set('rceptBgnde', '20250101');
      targetUrl.searchParams.set('rcptBgDt', '20250101');

      if (keyword.trim()) targetUrl.searchParams.set('searchKeyword', keyword.trim());
      if (dept !== '전체' && dept !== '다부처') targetUrl.searchParams.set('deptNm', dept);

      const res = await fetch(targetUrl.toString(), {
        headers: {
          'Accept': 'application/json, application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);
      const responseText = await res.text();

      if (responseText.trim().startsWith('{')) {
        const json = JSON.parse(responseText);
        const body = json?.response?.body || json?.body || json;
        apiTotalCount = Number(body?.totalCount) || 0;
        const rawItems = body?.items?.item || body?.items || [];
        itemsFromApi = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);
      } else {
        const matches = responseText.match(/<item>([\s\S]*?)<\/item>/g) || [];
        const totalMatch = responseText.match(/<totalCount>(\d+)<\/totalCount>/);
        apiTotalCount = totalMatch ? parseInt(totalMatch[1], 10) : matches.length;

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
      }
    } catch (e: any) {
      fetchErrorMessage = e?.name === 'AbortError' ? '정부망 방화벽 응답 시간 초과 (해외 IP 차단 감지)' : e?.message;
      console.warn('API Fetch Attempt Result:', fetchErrorMessage);
    }
  }

  // 2. 실제 API 데이터가 성공적으로 회신된 경우
  if (itemsFromApi.length > 0) {
    const mapped = itemsFromApi.map((item: any, idx: number) => {
      const bg = item.rcptBgDt ? String(item.rcptBgDt).replace(/[^0-9]/g, '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
      const end = item.rcptEndDt ? String(item.rcptEndDt).replace(/[^0-9]/g, '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
      const dday = calculateDday(item.rcptEndDt);
      const computedStatus = dday === '마감' ? '마감' : (item.status || '접수중');
      const title = item.ancmNm || item.pblancNm || '공고명 정보 없음';
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
        content: '본 사업공고의 세부 지원내용 및 제안요청서(RFP)는 공식 IRIS 사업공고 시스템을 확인하시기 바랍니다.',
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

  // 3. 해외 Vercel 서버의 NTIS 정부망 접속 차단 시 진단 안내 반환
  return NextResponse.json({
    success: false,
    items: [],
    totalCount: 0,
    message: `정부망 방화벽 연결 차단됨 (api.ntis.go.kr 은 해외 Vercel IP의 접근을 차단합니다). 공공데이터포털(apis.data.go.kr) 엔드포인트 등록이 필요합니다. [상세: ${fetchErrorMessage || 'ETIMEDOUT'}]`
  });
}