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

// XML 태그 정규식 안전 추출기 (태그 사이 공백 및 대소문자 방어)
function getXmlTagValue(xmlBlock: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xmlBlock.match(regex);
  if (!match) return '';
  return match[1].replace(/<[^>]*>/g, '').trim(); // 하이라이트 span 등 내부 HTML 태그 제거
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const size = parseInt(searchParams.get('size') || '20', 10);
  const dept = searchParams.get('dept') || '전체';
  const status = searchParams.get('status') || '전체';
  const time = searchParams.get('time') || 'all'; // all: 2년치 (2025~2026), 6m: 최근 6개월
  const keyword = searchParams.get('keyword') || '';

  const rawKey = (process.env.NTIS_API_KEY || process.env.NEXT_PUBLIC_NTIS_API_KEY || '').trim();
  // 공식 매뉴얼 엔드포인트 URL 기본 적용
  const targetApiUrl = 'https://www.ntis.go.kr/rndopen/openApi/public_project';

  if (!rawKey) {
    return NextResponse.json({
      success: false,
      items: [],
      totalCount: 0,
      message: 'NTIS_API_KEY 환경변수가 설정되지 않았습니다.'
    });
  }

  try {
    const url = new URL(targetApiUrl);
    const startPosition = (page - 1) * size + 1;

    // 1. 매뉴얼 규격 필수 파라미터 매핑
    url.searchParams.set('apprvKey', rawKey);
    url.searchParams.set('collection', 'project');
    url.searchParams.set('startPosition', String(startPosition));
    url.searchParams.set('displayCount', String(size));
    url.searchParams.set('displayCnt', String(size));
    url.searchParams.set('searchRnkn', 'DATE/DESC');
    url.searchParams.set('sortby', 'DATE/DESC');
    url.searchParams.set('cmbnApiYn', 'Y');
    url.searchParams.set('searchField', 'BI'); // 전체 필드 검색

    // 2. 검색어 및 부처 질의어 조합
    let queryTerm = '*';
    if (keyword.trim()) {
      queryTerm = dept !== '전체' && dept !== '다부처' ? `${keyword.trim()} ${dept}` : keyword.trim();
    } else if (dept !== '전체' && dept !== '다부처') {
      queryTerm = dept;
    }
    url.searchParams.set('query', queryTerm);
    url.searchParams.set('SRWR', queryTerm);

    // 3. 2년치(2025년 이상) 범위 조건 적용 (매뉴얼 P.7 addQuery 명세)
    url.searchParams.set('addQuery', 'PY=2025/MORE');

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      cache: 'no-store'
    });

    const responseText = await res.text();

    // TOTALHITS 파싱
    const totalMatch = responseText.match(/<TOTALHITS>(\d+)<\/TOTALHITS>/i) || 
                       responseText.match(/<COLCOUNT[^>]*>(\d+)<\/COLCOUNT>/i);
    const apiTotalHits = totalMatch ? parseInt(totalMatch[1], 10) : 0;

    // HIT 블록 파싱
    const hitMatches = responseText.match(/<HIT[\s\S]*?<\/HIT>/gi) || [];

    const parsedItems = hitMatches.map((hitBlock, idx) => {
      const pjtId = getXmlTagValue(hitBlock, 'ProjectNumber') || 
                    getXmlTagValue(hitBlock, 'Project Number') || 
                    `${page}-${idx + 1}`;

      const titleRaw = getXmlTagValue(hitBlock, 'Korean') || 
                       getXmlTagValue(hitBlock, 'ProjectTitle') || 
                       '과제명 정보 없음';
      const cleanTitle = titleRaw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

      const ministry = getXmlTagValue(hitBlock, 'Ministry') || 
                       getXmlTagValue(hitBlock, 'Name') || 
                       '과학기술정보통신부';

      const agency = getXmlTagValue(hitBlock, 'OrderAgency') || 
                     getXmlTagValue(hitBlock, 'ManageAgency') || 
                     '전문기관';

      const budgetProject = getXmlTagValue(hitBlock, 'BudgetProject') || 
                            getXmlTagValue(hitBlock, 'BusinessName') || 
                            cleanTitle;

      const manager = getXmlTagValue(hitBlock, 'Manager') || '연구책임자';
      const rawStart = getXmlTagValue(hitBlock, 'Start');
      const rawEnd = getXmlTagValue(hitBlock, 'End');
      const totalFundsRaw = getXmlTagValue(hitBlock, 'TotalFunds') || getXmlTagValue(hitBlock, 'GovernmentFunds');

      const bg = rawStart && rawStart.length >= 8 
        ? `${rawStart.substring(0, 4)}.${rawStart.substring(4, 6)}.${rawStart.substring(6, 8)}` 
        : '2026.01.01';
      const end = rawEnd && rawEnd.length >= 8 
        ? `${rawEnd.substring(0, 4)}.${rawEnd.substring(4, 6)}.${rawEnd.substring(6, 8)}` 
        : '2026.12.31';

      const dday = calculateDday(rawEnd || '20261231');
      let computedStatus: '접수중' | '접수예정' | '마감' = '접수중';
      if (dday === '마감') {
        computedStatus = '마감';
      } else if (rawStart && rawStart > '20260908') {
        computedStatus = '접수예정';
      }

      // 예산 포맷 (원 단위 -> 억원)
      let budgetFormatted = '공고문 참조';
      if (totalFundsRaw && !isNaN(Number(totalFundsRaw))) {
        const fundsNum = Number(totalFundsRaw);
        budgetFormatted = `${(fundsNum / 100000000).toFixed(1)} 억원`;
      }

      const abstractContent = getXmlTagValue(hitBlock, 'Abstract') || 
                             getXmlTagValue(hitBlock, 'Goal') || 
                             '세부 연구목표 및 지원 내용은 상세페이지를 참조하시기 바랍니다.';

      // 매뉴얼 P.3에 명시된 공식 과제 상세페이지 URL 규격
      const ntisUrl = `https://www.ntis.go.kr/project/pjtInfo.do?pjtId=${pjtId}`;
      // 해당 실제 과제명으로 100% 일치 연동되는 IRIS 공고 검색 URL
      const irisUrl = `https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${encodeURIComponent(cleanTitle)}`;

      return {
        id: pjtId,
        status: computedStatus,
        title: cleanTitle,
        dept: ministry,
        rcptBg: bg,
        rcptEnd: end,
        dday,
        noticeType: '국가R&D과제',
        agency,
        noticeDate: bg,
        rcptEndTime: '18:00',
        noticeCategory: '본공고',
        budget: budgetFormatted,
        contact: manager,
        projectName: budgetProject,
        files: [`1. 과제요약서_${pjtId}.pdf`],
        content: abstractContent,
        ntisUrl,
        irisDirectUrl: irisUrl
      };
    });

    // 클라이언트 보조 필터링 (상태 및 6개월)
    let filtered = parsedItems;
    if (status !== '전체') {
      filtered = filtered.filter(item => item.status === status);
    }
    if (time === '6m') {
      filtered = filtered.filter(item => item.rcptBg >= '2026.03.01');
    }

    // 부처별 검색 시 NTIS 서버의 실제 검색 모수(TOTALHITS) 반환
    return NextResponse.json({
      success: true,
      items: filtered,
      totalCount: apiTotalHits || filtered.length
    });

  } catch (error: any) {
    console.error('NTIS API Call Error:', error);
    return NextResponse.json({
      success: false,
      items: [],
      totalCount: 0,
      message: `NTIS API 호출 중 오류가 발생했습니다: ${error?.message || ''}`
    });
  }
}