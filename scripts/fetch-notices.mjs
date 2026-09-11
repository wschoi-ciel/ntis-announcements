import fs from 'fs';
import path from 'path';

// 영문 소문자 l(엘)이 반영된 정확한 키
const API_KEY = process.env.NTIS_API_KEY || '40r92e2l1t7p461hvbqd';
const USER_ID = process.env.NTIS_USER_ID || 'cwsjames1';
const TARGET_URL = 'https://www.ntis.go.kr/rndopen/openApi/public_project';

function calculateDday(endDateStr) {
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

function getXmlTag(xml, tag) {
  const tagPattern = tag.replace(/\s+/g, '\\s+');
  const reg = new RegExp(`<${tagPattern}[^>]*>([\\s\\S]*?)<\\/${tagPattern}>`, 'i');
  const match = xml.match(reg);
  if (!match) return '';
  return match[1].replace(/<[^>]*>/g, '').trim();
}

async function fetchBatch(keyword, startPos, count) {
  const params = new URLSearchParams();
  params.set('naviCount', '30');
  params.set('searchField', '');
  params.set('addQuery', '');
  params.set('query', keyword);
  params.set('displayCount', String(count));
  params.set('sortby', 'DATE/DESC');
  params.set('collection', 'project');
  params.set('boostquery', '');
  params.set('userId', USER_ID);
  params.set('startPosition', String(startPos));
  params.set('apprvKey', API_KEY);
  params.set('cmbnApiYn', 'Y');

  const res = await fetch(`${TARGET_URL}?${params.toString()}`, {
    headers: {
      'Accept': 'application/xml, text/xml, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  const xml = await res.text();

  if (xml.includes('접근 허용 IP가 아닙니다')) {
    throw new Error('IP 차단: 등록된 IP(1.217.108.124)가 아닙니다.');
  }

  if (xml.includes('유효한 인증키가 아닙니다')) {
    console.error('인증 실패 본문:', xml.slice(0, 200));
    throw new Error('인증키 불일치 오류');
  }

  const totalMatch = xml.match(/<TOTALHITS>(\d+)<\/TOTALHITS>/i);
  const totalHits = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const hitMatches = xml.match(/<HIT[\s\S]*?<\/HIT>/gi) || [];

  const items = hitMatches.map((hitBlock, idx) => {
    const pjtId = getXmlTag(hitBlock, 'Project Number') || getXmlTag(hitBlock, 'ProjectNumber') || `${startPos + idx}`;
    const rawTitle = getXmlTag(hitBlock, 'Korean') || getXmlTag(hitBlock, 'ProjectTitle') || '과제명 정보 없음';
    const cleanTitle = rawTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    const ministry = getXmlTag(hitBlock, 'Ministry') || getXmlTag(hitBlock, 'Name') || '과학기술정보통신부';
    const agency = getXmlTag(hitBlock, 'OrderAgency') || getXmlTag(hitBlock, 'ManageAgency') || '전문기관';
    const budgetProject = getXmlTag(hitBlock, 'BudgetProject') || cleanTitle;
    const manager = getXmlTag(hitBlock, 'Manager') || '연구책임자';
    const rawStart = getXmlTag(hitBlock, 'Start');
    const rawEnd = getXmlTag(hitBlock, 'End');
    const totalFundsRaw = getXmlTag(hitBlock, 'TotalFunds') || getXmlTag(hitBlock, 'GovernmentFunds');

    const bg = rawStart && rawStart.length >= 8 
      ? `${rawStart.substring(0, 4)}.${rawStart.substring(4, 6)}.${rawStart.substring(6, 8)}` : '2026.01.01';
    const end = rawEnd && rawEnd.length >= 8 
      ? `${rawEnd.substring(0, 4)}.${rawEnd.substring(4, 6)}.${rawEnd.substring(6, 8)}` : '2026.12.31';

    const dday = calculateDday(rawEnd || '20261231');
    const computedStatus = dday === '마감' ? '마감' : '접수중';

    let budget = '공고문 참조';
    if (totalFundsRaw && !isNaN(Number(totalFundsRaw))) {
      budget = `${(Number(totalFundsRaw) / 100000000).toFixed(1)} 억원`;
    }

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
      budget,
      contact: manager,
      projectName: budgetProject,
      files: [`1. 과제요약서_${pjtId}.pdf`],
      content: getXmlTag(hitBlock, 'Abstract') || '세부 연구목표는 상세페이지를 참조하시기 바랍니다.',
      ntisUrl: `https://www.ntis.go.kr/project/pjtInfo.do?pjtId=${pjtId}`,
      irisDirectUrl: `https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${encodeURIComponent(cleanTitle)}`
    };
  });

  return { items, totalHits };
}

async function run() {
  console.log('🚀 NTIS 전 부처 실제 공고 일괄 수집 시작...');
  const targetKeywords = ['모빌리티', '인공지능', '기술', '연구', '개발', '지원'];
  const allItemsMap = new Map();
  let grandTotal = 0;

  try {
    for (const kw of targetKeywords) {
      process.stdout.write(`📥 키워드 [${kw}] 과제 수집 중... `);
      const { items, totalHits } = await fetchBatch(kw, 1, 100);
      grandTotal += totalHits;
      
      items.forEach(item => {
        if (!allItemsMap.has(item.id)) {
          allItemsMap.set(item.id, item);
        }
      });
      console.log(`성공 (${items.length}건 획득 / 고유 누적: ${allItemsMap.size}건)`);
    }

    const finalItems = Array.from(allItemsMap.values());
    const outputDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'notices.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      updatedAt: new Date().toISOString(),
      totalCount: grandTotal || finalItems.length,
      items: finalItems
    }, null, 2), 'utf-8');

    console.log(`\n🎉 수집 대성공! 중복 제거된 총 ${finalItems.length}건의 실제 과제가 저장되었습니다.`);
  } catch (err) {
    console.error(`\n❌ 수집 실패:`, err.message);
    process.exit(1);
  }
}

run();