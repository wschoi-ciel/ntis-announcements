// app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// API 실패 시 혹은 빈 데이터일 때 노출할 기본 전체 공고 데이터 (업로드해주신 이미지 기준)
const FALLBACK_DATA = [
  {
    ancmId: "77106",
    ancmNm: "2026년도 산업기술RD연구기획사업 신규지원대상 연구개발과제 공고",
    deptNm: "기후에너지환경부",
    rcptBgDt: "2026.09.07",
    rcptEndDt: "2026.10.07",
    status: "접수예정",
    dtlUrl: "https://www.ntis.go.kr"
  },
  {
    ancmId: "77105",
    ancmNm: "2028년도 산업기술 RD사업(스마트전자 분야-중전기기) 기술수요조사 공고",
    deptNm: "산업통상자원부",
    rcptBgDt: "2026.09.03",
    rcptEndDt: "2026.09.30",
    status: "접수중",
    dtlUrl: "https://www.ntis.go.kr"
  },
  {
    ancmId: "77104",
    ancmNm: "2027년 국가기록관리 활용기술 연구개발(RD)사업 과제 수요조사",
    deptNm: "행정안전부",
    rcptBgDt: "2026.09.02",
    rcptEndDt: "2026.10.02",
    status: "접수중",
    dtlUrl: "https://www.ntis.go.kr"
  },
  {
    ancmId: "77103",
    ancmNm: "2027년도 서울지역 환경현안 해결을 위한 연구사업 과제 공모",
    deptNm: "기후에너지환경부",
    rcptBgDt: "2026.09.14",
    rcptEndDt: "2026.09.14",
    status: "접수예정",
    dtlUrl: "https://www.ntis.go.kr"
  },
  {
    ancmId: "77102",
    ancmNm: "2027년도 자원분야 RD사업 통합기술수요조사 공고",
    deptNm: "산업통상자원부",
    rcptBgDt: "2026.09.04",
    rcptEndDt: "2026.09.14",
    status: "접수중",
    dtlUrl: "https://www.ntis.go.kr"
  },
  {
    ancmId: "77101",
    ancmNm: "2026년 3차 재생에너지RD(태양광) 신규지원대상 연구개발과제 공고",
    deptNm: "기후에너지환경부",
    rcptBgDt: "2026.09.08",
    rcptEndDt: "2026.10.01",
    status: "접수예정",
    dtlUrl: "https://www.ntis.go.kr"
  },
  {
    ancmId: "77100",
    ancmNm: "2026년도 바이오의료기술개발사업 2차 신규과제 선정공고",
    deptNm: "과학기술정보통신부",
    rcptBgDt: "2026.09.01",
    rcptEndDt: "2026.09.28",
    status: "접수중",
    dtlUrl: "https://www.ntis.go.kr"
  },
  {
    ancmId: "77099",
    ancmNm: "중소기업 상용화 R&D 다부처 연계지원사업 모집공고",
    deptNm: "다부처",
    rcptBgDt: "2026.08.25",
    rcptEndDt: "2026.09.25",
    status: "접수중",
    dtlUrl: "https://www.ntis.go.kr"
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const dept = searchParams.get('dept') || '';

  const apiKey = process.env.NTIS_API_KEY;

  if (!apiKey) {
    // 키 미등록 시 즉시 Fallback 반환
    return NextResponse.json(filterList(FALLBACK_DATA, keyword, dept));
  }

  try {
    const targetUrl = new URL('https://api.ntis.go.kr/openapi/service/rest/RndNoticeService/getRndNoticeList');
    targetUrl.searchParams.set('serviceKey', decodeURIComponent(apiKey));
    targetUrl.searchParams.set('numOfRows', '50');
    targetUrl.searchParams.set('pageNo', '1');

    if (keyword) targetUrl.searchParams.set('searchKeyword', keyword);

    const res = await fetch(targetUrl.toString(), {
      headers: { 'Accept': 'application/xml, text/xml, */*' },
      next: { revalidate: 600 }
    });

    const rawText = await res.text();
    const parser = new XMLParser();
    const jsonObj = parser.parse(rawText);

    const rawItems = jsonObj?.response?.body?.items?.item;
    
    if (!rawItems) {
      // API 응답 구조가 비어있거나 승인 대기 상태일 때 Fallback 제공
      return NextResponse.json(filterList(FALLBACK_DATA, keyword, dept));
    }

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];
    
    // NTIS 원본 필드명을 통일된 모델로 매핑
    const normalizedItems = items.map((i: any) => ({
      ancmId: i.ancmId || i.pblancId || String(Math.floor(Math.random() * 10000)),
      ancmNm: i.ancmNm || i.pblancNm || '공고명 정보 없음',
      deptNm: i.deptNm || i.jrsdMininsttNm || '부처 공통',
      rcptBgDt: i.rcptBgDt || i.rcptBgnDe || '',
      rcptEndDt: i.rcptEndDt || i.rcptEndDe || '',
      status: i.status || '접수중',
      dtlUrl: i.dtlUrl || i.dtlPageUrl || '#'
    }));

    return NextResponse.json(filterList(normalizedItems, keyword, dept));
  } catch (error) {
    // 네트워크 장애 시에도 에러 화면 대신 목업 데이터 반환
    return NextResponse.json(filterList(FALLBACK_DATA, keyword, dept));
  }
}

function filterList(list: typeof FALLBACK_DATA, keyword: string, dept: string) {
  return list.filter(item => {
    const matchKeyword = !keyword || item.ancmNm.toLowerCase().includes(keyword.toLowerCase());
    const matchDept = !dept || dept === '전체' || (dept === '다부처' ? item.deptNm.includes('다부처') : item.deptNm === dept);
    return matchKeyword && matchDept;
  });
}