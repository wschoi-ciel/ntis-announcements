import fs from 'fs';
import path from 'path';

const API_KEY = process.env.NTIS_API_KEY || '40r92e211t7p461hvbqd';
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

async function run() {
  console.log('🚀 [배치 동기화] NTIS 전 부처 공고 데이터 수집 시작...');
  const outputDir = path.join(process.cwd(), 'public', 'data');
  const outputPath = path.join(outputDir, 'notices.json');

  // 기존 캐시 파일 확인
  let existingData = { totalCount: 0, items: [] };
  if (fs.existsSync(outputPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    } catch {}
  }

  const allItemsMap = new Map();
  // 기존 데이터 우선 보존
  if (existingData.items && Array.isArray(existingData.items)) {
    existingData.items.forEach(i => allItemsMap.set(i.id, i));
  }

  let totalHits = 0;

  try {
    const params = new URLSearchParams();
    params.set('naviCount', '30');
    params.set('searchField', '');
    params.set('addQuery', '');
    params.set('query', '지원');
    params.set('displayCount', '100');
    params.set('sortby', 'DATE/DESC');
    params.set('collection', 'project');
    params.set('userId', USER_ID);
    params.set('startPosition', '1');
    params.set('apprvKey', API_KEY);
    params.set('cmbnApiYn', 'Y');

    const res = await fetch(`${TARGET_URL}?${params.toString()}`, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const xml = await res.text();

    if (xml.includes('<HIT')) {
      const totalMatch = xml.match(/<TOTALHITS>(\d+)<\/TOTALHITS>/i);
      totalHits = totalMatch ? parseInt(totalMatch[1], 10) : 0;
      const hitMatches = xml.match(/<HIT[\s\S]*?<\/HIT>/gi) || [];

      hitMatches.forEach((hitBlock, idx) => {
        const pjtId = getXmlTag(hitBlock, 'Project Number') || getXmlTag(hitBlock, 'ProjectNumber') || `${idx + 1}`;
        const rawTitle = getXmlTag(hitBlock, 'Korean') || getXmlTag(hitBlock, 'ProjectTitle') || '과제 정보';
        const cleanTitle = rawTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        const ministry = getXmlTag(hitBlock, 'Ministry') || getXmlTag(hitBlock, 'Name') || '과학기술정보통신부';
        const agency = getXmlTag(hitBlock, 'OrderAgency') || getXmlTag(hitBlock, 'ManageAgency') || '전문기관';
        const rawStart = getXmlTag(hitBlock, 'Start');
        const rawEnd = getXmlTag(hitBlock, 'End');
        const totalFundsRaw = getXmlTag(hitBlock, 'TotalFunds') || getXmlTag(hitBlock, 'GovernmentFunds');

        const bg = rawStart && rawStart.length >= 8 ? `${rawStart.substring(0, 4)}.${rawStart.substring(4, 6)}.${rawStart.substring(6, 8)}` : '2026.01.01';
        const end = rawEnd && rawEnd.length >= 8 ? `${rawEnd.substring(0, 4)}.${rawEnd.substring(4, 6)}.${rawEnd.substring(6, 8)}` : '2026.12.31';
        const dday = calculateDday(rawEnd || '20261231');

        let budget = '공고문 참조';
        if (totalFundsRaw && !isNaN(Number(totalFundsRaw))) {
          budget = `${(Number(totalFundsRaw) / 100000000).toFixed(1)} 억원`;
        }

        allItemsMap.set(pjtId, {
          id: pjtId,
          status: dday === '마감' ? '마감' : '접수중',
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
          contact: getXmlTag(hitBlock, 'Manager') || '연구책임자',
          projectName: getXmlTag(hitBlock, 'BudgetProject') || cleanTitle,
          files: [`과제요약서_${pjtId}.pdf`],
          content: getXmlTag(hitBlock, 'Abstract') || '세부 지원 내용은 상세페이지를 참조하시기 바랍니다.',
          ntisUrl: `https://www.ntis.go.kr/project/pjtInfo.do?pjtId=${pjtId}`,
          irisDirectUrl: `https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${encodeURIComponent(cleanTitle)}`
        });
      });
      console.log(`✅ 신규 ${hitMatches.length}건 수집 완료.`);
    } else {
      console.warn('⚠️ API 응답에서 공고 목록을 수신하지 못했습니다. 기존 데이터를 유지합니다.');
    }
  } catch (err) {
    console.warn(`⚠️ 네트워크 통신 이슈 발생 (${err.message}). 기존 캐시 데이터를 유지합니다.`);
  }

  const finalItems = Array.from(allItemsMap.values());
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    totalCount: totalHits || finalItems.length,
    items: finalItems
  }, null, 2), 'utf-8');

  console.log(`🎉 동기화 완료: 총 ${finalItems.length}건 보존/저장됨.`);
}

run();