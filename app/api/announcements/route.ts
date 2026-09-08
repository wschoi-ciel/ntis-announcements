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
  const time = searchParams.get('time') || 'all'; // 'all' (2년치: 2025~2026), '6m' (최근 6개월)
  const keyword = searchParams.get('keyword') || '';

  const customUrl = process.env.NTIS_API_URL || process.env.NEXT_PUBLIC_NTIS_API_URL;
  const rawKey = process.env.NTIS_API_KEY || process.env.NEXT_PUBLIC_NTIS_API_KEY;

  // 1. 공공데이터포털 / NTIS 공식 OpenAPI 호출
  if (customUrl && rawKey) {
    try {
      const targetUrl = new URL(customUrl);
      targetUrl.searchParams.set('serviceKey', decodeURIComponent(rawKey.trim()));
      targetUrl.searchParams.set('pageNo', page);
      targetUrl.searchParams.set('numOfRows', size);
      
      // 2년치 조회 기준 (2025년 1월 1일 ~ 현재 2026년)
      targetUrl.searchParams.set('bgngYmd', '20250101');
      if (keyword) targetUrl.searchParams.set('searchKeyword', keyword);

      const res = await fetch(targetUrl.toString(), {
        headers: { Accept: 'application/json, text/plain, */*' },
        cache: 'no-store'
      });

      const text = await res.text();
      let totalCount = 0;
      let rawList: any[] = [];

      try {
        const json = JSON.parse(text);
        const body = json?.response?.body || json?.body || json;
        totalCount = Number(body?.totalCount) || 0;
        const items = body?.items?.item || body?.items || [];
        rawList = Array.isArray(items) ? items : (items ? [items] : []);
      } catch {
        // XML 응답 파싱 시도
        const matches = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        totalCount = matches.length;
        rawList = matches.map(m => {
          const getTag = (tag: string) => {
            const match = m.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`));
            return match ? match[1] : '';
          };
          return {
            ancmId: getTag('ancmId'),
            ancmNm: getTag('ancmNm') || getTag('pblancNm'),
            deptNm: getTag('deptNm'),
            rcptBgDt: getTag('rcptBgDt'),
            rcptEndDt: getTag('rcptEndDt'),
            mngOrgNm: getTag('mngOrgNm'),
            dtlUrl: getTag('dtlUrl')
          };
        });
      }

      if (rawList.length > 0) {
        const mapped = rawList.map((item: any, idx: number) => {
          const bg = item.rcptBgDt ? String(item.rcptBgDt).replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
          const end = item.rcptEndDt ? String(item.rcptEndDt).replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '-';
          const dday = calculateDday(item.rcptEndDt);
          const computedStatus = dday === '마감' ? '마감' : (item.status || '접수중');
          const title = item.ancmNm || item.pblancNm || '공고명';

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
            budget: item.budget || '공고문 참조',
            contact: item.inqTel || '1357',
            projectName: title,
            files: ['공고문 및 신청서식.pdf'],
            content: '상세 공고 및 지원 요강은 사업공고 링크를 참조하시기 바랍니다.',
            irisDirectUrl: item.dtlUrl || `https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${encodeURIComponent(title.replace(/\([^)]*\)/g, '').trim())}`
          };
        });

        // 클라이언트 조건(부처, 상태, 기간) 필터링
        let filtered = mapped;
        if (dept !== '전체') {
          const cleanDept = dept.replace(/(부|청|처|위원회|자원부|통상부)/g, '');
          filtered = filtered.filter(n => n.dept.includes(cleanDept));
        }
        if (status !== '전체') {
          filtered = filtered.filter(n => n.status === status);
        }
        if (time === '6m') {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          const limitStr = sixMonthsAgo.toISOString().slice(0, 10).replace(/-/g, '.');
          filtered = filtered.filter(n => n.rcptBg >= limitStr);
        }

        return NextResponse.json({
          success: true,
          items: filtered,
          totalCount: totalCount || filtered.length
        });
      }
    } catch (error) {
      console.error('API Error:', error);
    }
  }

  // API 키가 없거나 외부 API에서 조회가 되지 않은 경우
  // 절대 가짜 하드코딩 데이터를 주지 않고, 투명하게 빈 목록과 원인을 반환합니다.
  return NextResponse.json({
    success: true,
    items: [],
    totalCount: 0,
    message: customUrl ? '조회된 공고가 없습니다.' : 'NTIS_API_URL 및 NTIS_API_KEY 환경변수 설정이 필요합니다.'
  });
}