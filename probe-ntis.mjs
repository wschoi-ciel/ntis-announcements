const API_KEY = '40r92e211t7p461hvbqd';
const USER_ID = 'cwsjames1';

const endpoints = [
  { name: '1. NTIS 통합공고 (openApi/public_ancm)', url: 'https://www.ntis.go.kr/rndopen/openApi/public_ancm' },
  { name: '2. NTIS 사업공고 (openApi/ancm)', url: 'https://www.ntis.go.kr/rndopen/openApi/ancm' },
  { name: '3. NTIS R&D공고 (openApi/rndPblanc)', url: 'https://www.ntis.go.kr/rndopen/openApi/rndPblanc' },
  { name: '4. NTIS 공고 REST (openApi/pblancList)', url: 'https://www.ntis.go.kr/rndopen/openApi/pblancList' },
  { name: '5. 공공데이터 연계 게이트웨이', url: 'https://apis.data.go.kr/1300000/RndPblancInfoService/getRndPblancInfoList' }
];

async function probe() {
  console.log('🔍 발급키의 실제 대상 엔드포인트 탐색 중...\n');

  for (const ep of endpoints) {
    const params = new URLSearchParams();
    params.set('apprvKey', API_KEY);
    params.set('apiKey', API_KEY);
    params.set('serviceKey', API_KEY);
    params.set('userId', USER_ID);
    params.set('displayCount', '5');
    params.set('numOfRows', '5');
    params.set('pageNo', '1');
    params.set('startPosition', '1');
    params.set('query', '지원');

    try {
      const res = await fetch(`${ep.url}?${params.toString()}`, {
        headers: { 'Accept': 'application/xml, application/json, */*' }
      });
      const txt = await res.text();
      const snippet = txt.replace(/\s+/g, ' ').slice(0, 120);
      
      const isSuccess = !txt.includes('유효한 인증키가 아닙니다') && 
                        !txt.includes('접근 허용 IP') && 
                        (txt.includes('<HIT') || txt.includes('<item') || txt.includes('"items"') || txt.includes('totalCount'));

      if (isSuccess) {
        console.log(`✅ [성공] ${ep.name}`);
        console.log(`   응답: ${snippet}\n`);
      } else {
        console.log(`❌ [불가] ${ep.name} -> ${snippet}`);
      }
    } catch (e) {
      console.log(`⚠️ [통신 실패] ${ep.name} (${e.message})`);
    }
  }
}

probe();