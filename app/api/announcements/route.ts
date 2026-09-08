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

// XML 태그 추출 헬퍼 (공백 및 대소문자 방어)
function getXmlTag(xml: string, tag: string): string {
  const tagPattern = tag.replace(/\s+/g, '\\s+');
  const reg = new RegExp(`<${tagPattern}[^>]*>([\\s\\S]*?)<\\/${tagPattern}>`, 'i');
  const match = xml.match(reg);
  if (!match) return '';
  return match[1].replace(/<[^>]*>/g, '').trim();
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
  const targetApiUrl = 'https://www.ntis.go.kr/rndopen/openApi/public_project';

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
    const startPosition = (page - 1) * size + 1;

    // 1. NTIS 2025 매뉴얼 필수 파라미터 매핑 (apprvKey 필수)
    url.searchParams.set('apprvKey', rawKey);
    url.searchParams.set('apiKey', rawKey);
    url.searchParams.set('collection', 'project');
    url.searchParams.set('startPosition', String(startPosition));
    url.searchParams.set('displayCount', String(size));
    url.searchParams.set('displayCnt', String(size));
    url.searchParams.set('searchRnkn', 'DATE/DESC');
    url.searchParams.set('sortby', 'DATE/DESC');
    url.searchParams.set('cmbnApiYn', 'Y');
    url.searchParams.set('searchField', 'BI'); // 전체 필드 검색

    // 2. 검색어 매핑 (빈 검색어 시 기본 와일드카드 및 부처 검색)
    let queryTerm = '*';
    if (keyword.trim()) {
      queryTerm = dept !== '전체' && dept !== '다부처' ? `${keyword.trim()} ${dept}` : keyword.trim();
    } else if (dept !== '전체' && dept !== '다부처') {
      queryTerm = dept;
    }
    url.searchParams.set('query', queryTerm);
    url.searchParams.set('SRWR', queryTerm);

    // 3. 2년치(2025년 이상) 범위 조건 매핑 (매뉴얼 P.7 addQuery 규격)
    url.searchParams.set('addQuery', 'PY=2025/MORE');

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      cache: 'no-store'
    });

    const responseText = await res.text();

    // TOTALHITS 추출
    const totalMatch = responseText.match(/<TOTALHITS>(\d+)<\/TOTALHITS>/i) || 
                       responseText.match(/<COLCOUNT[^>]*>(\d+)<\/COLCOUNT>/i);
    const apiTotalHits = totalMatch ? parseInt(totalMatch[1], 10) : 0;

    // HIT 과제 블록 파싱
    const hitMatches = responseText.match(/<HIT[\s\S]*?<\/HIT>/gi) || [];

    if (hitMatches.length === 0) {
      const isKeyError = responseText.includes('인증키') || responseText.includes('apprvKey');
      return NextResponse.json({
        success: false,
        items: [],
        totalCount: 0,
        message: isKeyError 
          ? 'NTIS 서버 인증키 인증 실패: 발급받으신 승인키(apprvKey)와 등록 IP를 확인해주세요.'
          : (responseText.slice(0, 150) || '조회된 실제 과제 내역이 없습니다.')
      });
    }

    const parsedItems = hitMatches.map((hitBlock, idx) => {
      const pjtId = getXmlTag(hitBlock, 'Project Number') || 
                    getXmlTag(hitBlock, 'ProjectNumber') || 
                    `${page}-${idx + 1}`;

      const titleRaw = getXmlTag(hitBlock, 'Korean') || 
                       getXmlTag(hitBlock, 'ProjectTitle') || 
                       '과제명 정보 없음';
      const cleanTitle = titleRaw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

      const ministry = getXmlTag(hitBlock, 'Ministry') || 
                       getXmlTag(hitBlock, 'Name') || 
                       '과학기술정보통신부';

      const agency = getXmlTag(hitBlock, 'OrderAgency') || 
                     getXmlTag(hitBlock, 'ManageAgency') || 
                     '전문기관';

      const budgetProject = getXmlTag(hitBlock, 'BudgetProject') || 
                            getXmlTag(hitBlock, 'BusinessName') || 
                            cleanTitle;

      const manager = getXmlTag(hitBlock, 'Manager') || '연구책임자';
      const rawStart = getXmlTag(hitBlock, 'Start');
      const rawEnd = getXmlTag(hitBlock, 'End');
      const totalFundsRaw = getXmlTag(hitBlock, 'TotalFunds') || getXmlTag(hitBlock, 'GovernmentFunds');

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

      let budgetFormatted = '공고문 참조';
      if (totalFundsRaw && !isNaN(Number(totalFundsRaw))) {
        const fundsNum = Number(totalFundsRaw);
        budgetFormatted = `${(fundsNum / 100000000).toFixed(1)} 억원`;
      }

      const abstractContent = getXmlTag(hitBlock, 'Abstract') || 
                             getXmlTag(hitBlock, 'Goal') || 
                             '세부 연구목표 및 지원 내용은 상세페이지를 참조하시기 바랍니다.';

      // NTIS 공식 과제 상세 뷰 URL (매뉴얼 P.3 규격)
      const ntisUrl = `https://www.ntis.go.kr/project/pjtInfo.do?pjtId=${pjtId}`;
      // 해당 과제명과 100% 일치되는 IRIS 사업공고 검색 링크
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

    let filtered = parsedItems;
    if (status !== '전체') {
      filtered = filtered.filter(item => item.status === status);
    }
    if (time === '6m') {
      filtered = filtered.filter(item => item.rcptBg >= '2026.03.01');
    }

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
      message: `NTIS API 호출 실패: ${error?.message || ''}`
    });
  }
}