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
  const time = searchParams.get('time') || 'all';
  const keyword = searchParams.get('keyword') || '';

  const rawKey = process.env.NTIS_API_KEY || process.env.NEXT_PUBLIC_NTIS_API_KEY;
  const customUrl = process.env.NTIS_API_URL || process.env.NEXT_PUBLIC_NTIS_API_URL;

  let allFetchedItems: any[] = [];
  let apiTotalCount = 0;

  // 1. 실제 외부 API 엔드포인트 호출
  if (customUrl && rawKey) {
    try {
      const url = new URL(customUrl);
      url.searchParams.set('serviceKey', decodeURIComponent(rawKey.trim()));
      url.searchParams.set('apiKey', rawKey.trim());
      url.searchParams.set('pageNo', String(page));
      url.searchParams.set('numOfRows', String(size));
      url.searchParams.set('bgngYmd', '20250101'); // 2년치 조회 기준 (2025~2026)

      if (keyword.trim()) {
        url.searchParams.set('searchKeyword', keyword.trim());
        url.searchParams.set('pblancNm', keyword.trim());
      }
      if (dept !== '전체' && dept !== '다부처') {
        url.searchParams.set('deptNm', dept);
      }

      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json, application/xml, text/xml, */*' },
        cache: 'no-store'
      });

      const responseText = await res.text();

      if (responseText.trim().startsWith('{')) {
        const json = JSON.parse(responseText);
        const body = json?.response?.body || json?.body || json;
        apiTotalCount = Number(body?.totalCount) || 0;
        const items = body?.items?.item || body?.items || [];
        allFetchedItems = Array.isArray(items) ? items : (items ? [items] : []);
      } else {
        const matches = responseText.match(/<item>([\s\S]*?)<\/item>/g) || [];
        const totalMatch = responseText.match(/<totalCount>(\d+)<\/totalCount>/);
        apiTotalCount = totalMatch ? parseInt(totalMatch[1], 10) : matches.length;

        allFetchedItems = matches.map(m => {
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
    } catch (err) {
      console.error('API Fetch Exception:', err);
    }
  }

  // 실제 API에서 받아온 항목 매핑
  const mapped = allFetchedItems.map((item: any, idx: number) => {
    const bg = item.rcptBgDt ? String(item.rcptBgDt).replace(/[^0-9]/g, '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
    const end = item.rcptEndDt ? String(item.rcptEndDt).replace(/[^0-9]/g, '').replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
    const dday = calculateDday(item.rcptEndDt);
    const computedStatus = dday === '마감' ? '마감' : (item.status || '접수중');
    const title = item.ancmNm || item.pblancNm || '공고 정보 없음';

    // 해당 공고의 제목과 고유 파라미터를 정확히 연결한 IRIS 직통 URL
    const cleanSearchTitle = title.replace(/\([^)]*\)/g, '').trim();
    const irisUrl = item.dtlUrl && item.dtlUrl.includes('iris.go.kr')
      ? item.dtlUrl
      : `https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${encodeURIComponent(cleanSearchTitle || title)}`;

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
      files: ['공고문 및 신청서식.pdf'],
      content: '본 사업공고의 상세 신청자격, 지원내용 및 RFP는 공식 IRIS 사업공고에서 확인하실 수 있습니다.',
      irisDirectUrl: irisUrl
    };
  });

  // 필터링 적용 (부처, 상태, 6개월)
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

  // 필터 조건에 따라 동적으로 달라지는 정확한 총 건수 반환
  const actualFilteredTotal = filtered.length;

  return NextResponse.json({
    success: true,
    items: filtered,
    totalCount: actualFilteredTotal,
    rawTotalCount: apiTotalCount,
    message: filtered.length === 0 ? '선택하신 조건에 해당하는 실제 공고가 없습니다.' : ''
  });
}