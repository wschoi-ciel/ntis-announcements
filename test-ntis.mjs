const API_KEY = '40r92e211t7p461hvbqd';
const USER_ID = 'cwsjames1';
const TARGET_URL = 'https://www.ntis.go.kr/rndopen/openApi/public_project';

async function test() {
  const params = new URLSearchParams();
  params.set('naviCount', '30');
  params.set('searchField', '');
  params.set('addQuery', '');
  params.set('query', '나노');
  params.set('displayCount', '10');
  params.set('sortby', 'DATE/DESC');
  params.set('collection', 'project');
  params.set('boostquery', '');
  params.set('userId', USER_ID);
  params.set('startPosition', '1');
  params.set('apprvKey', API_KEY);
  params.set('cmbnApiYn', 'Y');

  console.log('📡 NTIS 검증 요청 전송 중 (userId: ' + USER_ID + ')...');

  const res = await fetch(\?\, {
    headers: {
      'Accept': 'application/xml, text/xml, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  const text = await res.text();
  console.log('\n--- [서버 응답 결과] ---');
  console.log(text.slice(0, 500));
  console.log('------------------------\n');
}

test();