// app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const size = parseInt(searchParams.get('size') || '20', 10);
  const dept = searchParams.get('dept') || '전체';
  const status = searchParams.get('status') || '전체';
  const time = searchParams.get('time') || 'all';
  const keyword = searchParams.get('keyword') || '';

  const filePath = path.join(process.cwd(), 'public', 'data', 'notices.json');

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({
      success: false,
      items: [],
      totalCount: 0,
      message: '공고 데이터 파일(notices.json)이 아직 생성되지 않았습니다. 수집 스크립트를 먼저 실행해주세요.'
    });
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(rawData);
    let items: any[] = parsed.items || [];

    // 1. 부처 필터
    if (dept !== '전체') {
      const cleanDept = dept.replace(/(부|청|처|위원회|자원부|통상부)/g, '');
      items = items.filter(n => n.dept && n.dept.includes(cleanDept));
    }

    // 2. 상태 필터
    if (status !== '전체') {
      items = items.filter(n => n.status === status);
    }

    // 3. 기간 필터 (최근 6개월)
    if (time === '6m') {
      items = items.filter(n => n.rcptBg >= '2026.03.01');
    }

    // 4. 키워드 필터
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      items = items.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.dept && n.dept.toLowerCase().includes(q)) ||
        (n.agency && n.agency.toLowerCase().includes(q)) ||
        (n.projectName && n.projectName.toLowerCase().includes(q))
      );
    }

    const filteredTotal = items.length;
    const startIndex = (page - 1) * size;
    const paginated = items.slice(startIndex, startIndex + size);

    return NextResponse.json({
      success: true,
      items: paginated,
      totalCount: filteredTotal,
      updatedAt: parsed.updatedAt
    });

  } catch (e: any) {
    return NextResponse.json({
      success: false,
      items: [],
      totalCount: 0,
      message: `데이터 파싱 에러: ${e?.message}`
    });
  }
}