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

  const deptCountMap: Record<string, number> = {
    '전체': 77106,
    '국토교통부': 3773,
    '중소벤처기업부': 12450,
    '과학기술정보통신부': 18920,
    '산업통상자원부': 21400,
    '행정안전부': 2840,
    '다부처': 1580,
  };

  const baseTotal = deptCountMap[dept] || 3000;

  // 전체 가상 공고 데이터셋 생성
  const allNotices = Array.from({ length: 120 }, (_, i) => {
    const serialNumber = baseTotal - i;
    const actualDept = dept === '전체' 
      ? ['국토교통부', '중소벤처기업부', '과학기술정보통신부', '산업통상자원부', '행정안전부'][i % 5]
      : dept;

    // 접수중, 접수예정, 마감 상태를 규칙적으로 배치
    let itemStatus: '접수중' | '접수예정' | '마감';
    let month: number;
    let endDay: number;
    let bgDay: number;

    if (i % 3 === 0) {
      itemStatus = '접수중';
      month = 10;
      bgDay = 5 + (i % 10);
      endDay = 25 + (i % 5);
    } else if (i % 3 === 1) {
      itemStatus = '접수예정';
      month = 11;
      bgDay = 10 + (i % 10);
      endDay = 28;
    } else {
      itemStatus = '마감';
      month = 3 + (i % 5);
      bgDay = 2;
      endDay = 20;
    }

    const mStr = String(month).padStart(2, '0');
    const bgStr = String(bgDay).padStart(2, '0');
    const endStr = String(endDay).padStart(2, '0');
    const rcptBg = `2026.${mStr}.${bgStr}`;
    const rcptEnd = `2026.${mStr}.${endStr}`;
    const dday = itemStatus === '마감' ? '마감' : calculateDday(`2026${mStr}${endStr}`);

    return {
      id: serialNumber,
      status: itemStatus,
      title: `(공고-제2026-${serialNumber}호) ${actualDept} 2026년도 국가R&D 전략기술개발 및 실증과제 공고`,
      dept: actualDept,
      rcptBg,
      rcptEnd,
      dday,
      noticeType: i % 2 === 0 ? '통합공고' : '개별공고',
      agency: `${actualDept} 전문관리기관`,
      noticeDate: rcptBg,
      rcptEndTime: '18:00',
      noticeCategory: i % 4 === 0 ? '수요조사' : '본공고',
      budget: `${(i * 0.4 + 2.5).toFixed(1)} 억원`,
      contact: '042-869-1114',
      projectName: `${actualDept} 미래핵심 연구개발사업`,
      files: [`1. 2026년도_${actualDept}_공고문_${serialNumber}.pdf`],
      content: '본 공고의 세부 신청자격, 지원내용 및 서식은 범부처통합연구지원시스템(IRIS) 사업공고를 참조하시기 바랍니다.'
    };
  });

  // 상태 필터 적용
  let filtered = allNotices;
  if (status !== '전체') {
    filtered = filtered.filter(item => item.status === status);
  }

  // 기간 필터 적용
  if (time === '6m') {
    filtered = filtered.filter(item => item.rcptBg >= '2026.03.01');
  }

  // 검색어 필터 적용
  if (keyword.trim()) {
    const q = keyword.toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.dept.toLowerCase().includes(q) ||
      item.agency.toLowerCase().includes(q)
    );
  }

  // 페이징 계산
  const totalCount = filtered.length;
  const startIndex = (page - 1) * size;
  const paginated = filtered.slice(startIndex, startIndex + size);

  return NextResponse.json({
    success: true,
    items: paginated,
    totalCount: totalCount
  });
}