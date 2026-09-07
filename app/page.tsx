// app/page.tsx
'use client';

import { useState } from 'react';
import { Search, RotateCcw, Calendar, FileDown, CheckSquare, Download } from 'lucide-react';

// 첨부 이미지의 32개 부처 완벽 일치 목록
const DEPARTMENTS = [
  '개인정보보호위원회', '경찰청', '고용노동부', '고준위방사성폐기물관리위원회', '공정거래위원회', '과학기술정보통신부', '교육부', '국가데이터처',
  '국가보훈부', '국가유산청', '국무조정실', '국방부', '국토교통부', '국회', '기상청', '기획예산처', '기획재정부', '기후에너지환경부',
  '농림축산식품부', '농촌진흥청', '대통령경호처', '대통령비서실', '문화재청', '문화체육관광부', '방송미디어통신위원회', '방위사업청', '법무부', '법제처',
  '보건복지부', '산림청', '산업통상부', '성평등가족부', '소방청', '식품의약품안전처', '외교부', '우주항공청', '원자력안전위원회', '재정경제부',
  '중소벤처기업부', '지식재산처', '질병관리청', '통일부', '해양경찰청', '해양수산부', '행정안전부', '다부처', '기타'
];

// 화면 초기 로딩 시 첨부 화면과 동일하게 표시될 기본 데이터
const INITIAL_NOTICES = [
  {
    id: 77106,
    status: '접수예정',
    title: '2026년도 산업기술RD연구기획사업 신규지원대상 연구개발과제 공고',
    dept: '기후에너지환경부',
    rcptBg: '2026.09.07',
    rcptEnd: '2026.10.07',
    dday: 'D-30'
  },
  {
    id: 77105,
    status: '접수중',
    title: '2028년도 산업기술 RD사업(스마트전자 분야-중전기기) 기술수요조사 공고',
    dept: '산업통상부',
    rcptBg: '2026.09.03',
    rcptEnd: '2026.09.30',
    dday: 'D-23'
  },
  {
    id: 77104,
    status: '접수중',
    title: '2027년 국가기록관리 활용기술 연구개발(RD)사업 과제 수요조사',
    dept: '행정안전부',
    rcptBg: '2026.09.02',
    rcptEnd: '2026.10.02',
    dday: 'D-25'
  },
  {
    id: 77103,
    status: '접수예정',
    title: '2027년도 서울지역 환경현안 해결을 위한 연구사업 과제 공모',
    dept: '기후에너지환경부',
    rcptBg: '2026.09.14',
    rcptEnd: '2026.09.14',
    dday: 'D -7'
  },
  {
    id: 77102,
    status: '접수중',
    title: '2027년도 자원분야 RD사업 통합기술수요조사 공고',
    dept: '산업통상부',
    rcptBg: '2026.09.04',
    rcptEnd: '2026.09.14',
    dday: 'D -7'
  },
  {
    id: 77101,
    status: '접수예정',
    title: '2026년 3차 재생에너지RD(태양광) 신규지원대상 연구개발과제 공고',
    dept: '기후에너지환경부',
    rcptBg: '2026.09.08',
    rcptEnd: '2026.10.01',
    dday: 'D-24'
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('공고정보');
  const [noticeType, setNoticeType] = useState('전체');
  const [noticeStatus, setNoticeStatus] = useState('전체');
  const [selectedDept, setSelectedDept] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [allChecked, setAllChecked] = useState(false);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const handleReset = () => {
    setNoticeType('전체');
    setNoticeStatus('전체');
    setSelectedDept('전체');
    setKeyword('');
  };

  const handleCheckAll = () => {
    if (allChecked) {
      setCheckedItems([]);
    } else {
      setCheckedItems(filteredList.map(n => n.id));
    }
    setAllChecked(!allChecked);
  };

  const handleItemCheck = (id: number) => {
    setCheckedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 필터링 적용 (기본값일 때는 첨부 이미지와 같은 6개 목록 즉시 표시)
  const filteredList = INITIAL_NOTICES.filter(notice => {
    const matchDept = selectedDept === '전체' || notice.dept === selectedDept;
    const matchStatus = noticeStatus === '전체' || notice.status === noticeStatus;
    const matchKw = !keyword || notice.title.includes(keyword);
    return matchDept && matchStatus && matchKw;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#333] font-sans pb-16">
      {/* 1. 최상단 타이틀 */}
      <div className="max-w-[1240px] mx-auto pt-6 px-4">
        <h1 className="text-2xl font-black text-black tracking-tight mb-4">국가R&D통합공고</h1>

        {/* 탭 네비게이션 */}
        <div className="flex border-b-2 border-[#ff6000] text-sm font-bold text-gray-600 gap-6">
          {['공고정보', '사업자료실', 'MY공고', '알리미신청', 'RSS신청'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 px-1 relative transition-colors ${
                activeTab === tab ? 'text-[#ff6000]' : 'hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 mt-4 space-y-4">
        {/* 2. 메인 조건 선택 박스 (격자형) */}
        <div className="border border-[#c7cdd5] bg-white text-[12px] shadow-sm">
          {/* 공고형태 행 */}
          <div className="grid grid-cols-[120px_1fr] border-b border-[#e1e4e8]">
            <div className="bg-[#f0f2f5] font-bold text-gray-700 flex items-center justify-between px-4 border-r border-[#e1e4e8]">
              <span>공고형태</span>
              <span className="text-[10px] text-gray-400">▶</span>
            </div>
            <div className="grid grid-cols-4 divide-x divide-[#e1e4e8] text-center">
              {['전체', '통합공고', '개별공고', '도움말'].map(type => (
                <button
                  key={type}
                  onClick={() => setNoticeType(type)}
                  className={`py-2 ${
                    noticeType === type ? 'bg-[#ff6000] text-white font-bold' : 'hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 공고현황 행 */}
          <div className="grid grid-cols-[120px_1fr] border-b border-[#e1e4e8]">
            <div className="bg-[#f0f2f5] font-bold text-gray-700 flex items-center justify-between px-4 border-r border-[#e1e4e8]">
              <span>공고현황</span>
              <span className="text-[10px] text-gray-400">▶</span>
            </div>
            <div className="grid grid-cols-4 divide-x divide-[#e1e4e8] text-center">
              {['전체', '접수예정', '접수중', '마감'].map(status => (
                <button
                  key={status}
                  onClick={() => setNoticeStatus(status)}
                  className={`py-2 ${
                    noticeStatus === status ? 'bg-[#ff6000] text-white font-bold' : 'hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* 부처명 그리드 행 */}
          <div className="grid grid-cols-[120px_1fr]">
            <div className="bg-[#f0f2f5] font-bold text-gray-700 flex items-center justify-between px-4 border-r border-[#e1e4e8]">
              <span>부처명</span>
              <span className="text-[10px] text-gray-400">▶</span>
            </div>
            <div className="p-0">
              <div className="grid grid-cols-8 divide-x divide-y divide-[#e1e4e8] text-center border-b border-[#e1e4e8]">
                {/* 전체 버튼 */}
                <button
                  onClick={() => setSelectedDept('전체')}
                  className={`py-2 font-bold ${
                    selectedDept === '전체' ? 'bg-[#ff6000] text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  전체
                </button>
                {/* 32개 세부 부처 */}
                {DEPARTMENTS.slice(0, 46).map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    title={dept}
                    className={`py-2 px-1 truncate transition-colors ${
                      selectedDept === dept ? 'bg-[#ff6000] text-white font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
                {/* 설정초기화 버튼 */}
                <button
                  onClick={handleReset}
                  className="py-2 flex items-center justify-center gap-1 text-[#0070d2] font-bold hover:bg-gray-50"
                >
                  <RotateCcw className="w-3 h-3 text-[#0070d2]" /> 설정초기화
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 안내 문구 박스 */}
        <div className="space-y-1 text-[12px] text-gray-600">
          <div className="flex items-start gap-1.5">
            <span className="bg-gray-300 text-white font-bold px-1 rounded-sm text-[10px]">!</span>
            <p>2018년 이전 국가R&D통합공고는 접수일, 접수마감시간, 공고형태, 공고유형, 공고규모, 문의처, 사업명 정보가 제공되지 않습니다</p>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="bg-gray-300 text-white font-bold px-1 rounded-sm text-[10px]">!</span>
            <p>본 통합공고는 관련된 기관에서 자동수집 방식으로 수집되어, <span className="font-bold text-gray-800">R&D사업과 비R&D사업 공고가 포함됩니다.</span> 자세한 공고 정보는 해당 공고의 첨부파일 등을 통해 확인하시기 바랍니다</p>
          </div>
        </div>

        {/* 4. 검색 상세 바 */}
        <div className="border border-[#c7cdd5] bg-[#fbfcfd] p-4 text-[12px] space-y-3 shadow-sm">
          {/* 키워드 검색 줄 */}
          <div className="flex items-center gap-4">
            <span className="w-16 font-bold text-gray-700">키워드</span>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="국가R&D통합공고 키워드 검색"
                className="w-full max-w-xl px-3 py-1.5 border border-gray-300 bg-white rounded-none focus:outline-none focus:border-blue-500"
              />
              <label className="flex items-center gap-1 cursor-pointer text-gray-600">
                <input type="checkbox" className="rounded-none" /> 공고기관 검색
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-gray-600">
                <input type="checkbox" className="rounded-none" /> 첨부파일명 검색
              </label>
            </div>
          </div>

          {/* 공고일, 유형, 규모, 마감일 및 검색버튼 줄 */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="w-16 font-bold text-gray-700">공고일</span>
            <div className="flex items-center gap-1">
              <input type="text" className="w-24 px-2 py-1.5 border border-gray-300 bg-white" placeholder="" />
              <button className="p-1.5 border border-gray-300 bg-gray-100 text-gray-600"><Calendar className="w-3.5 h-3.5" /></button>
              <span>~</span>
              <input type="text" className="w-24 px-2 py-1.5 border border-gray-300 bg-white" placeholder="" />
              <button className="p-1.5 border border-gray-300 bg-gray-100 text-gray-600"><Calendar className="w-3.5 h-3.5" /></button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 ml-2">공고유형</span>
              <select className="px-3 py-1.5 border border-gray-300 bg-white">
                <option>전체</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">공고규모</span>
              <select className="px-3 py-1.5 border border-gray-300 bg-white">
                <option>전체</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">마감일</span>
              <select className="px-3 py-1.5 border border-gray-300 bg-white">
                <option>전체</option>
              </select>
            </div>

            <button
              onClick={() => {}}
              className="ml-auto px-8 py-1.5 bg-[#0070d2] text-white font-bold rounded-none hover:bg-[#005bb5] transition-colors"
            >
              검색
            </button>
          </div>
        </div>

        {/* 5. 검색결과 통계 및 상단 버튼 */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-base font-bold">
            검색결과 <span className="text-[#0070d2]">77,106</span>건
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button className="px-4 py-1.5 bg-[#0070d2] text-white font-bold flex items-center gap-1">
              이용자 매뉴얼 다운로드
            </button>
            <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              등록신청
            </button>
            <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 flex items-center gap-1 hover:bg-gray-50">
              <span className="text-green-600 font-black">X</span> 리스트 다운로드
            </button>
            <select className="border border-gray-300 bg-white py-1.5 px-2">
              <option>10 개</option>
              <option>20 개</option>
              <option>50 개</option>
            </select>
            <button className="px-3 py-1.5 border border-gray-300 bg-gray-100 text-gray-700">
              적용
            </button>
          </div>
        </div>

        {/* 6. 공고 테이블 리스트 */}
        <div className="border-t-2 border-black border-b border-[#c7cdd5] bg-white overflow-x-auto text-[12px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-gray-200 text-gray-600 text-center font-bold">
                <th className="py-3 px-3 w-10 border-r border-gray-200">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={handleCheckAll}
                  />
                </th>
                <th className="py-3 px-3 w-16 border-r border-gray-200">순번</th>
                <th className="py-3 px-4 w-24 border-r border-gray-200">현황</th>
                <th className="py-3 px-4 text-center border-r border-gray-200">공고명</th>
                <th className="py-3 px-4 w-36 border-r border-gray-200">부처명</th>
                <th className="py-3 px-3 w-28 border-r border-gray-200">접수일 ⬇</th>
                <th className="py-3 px-3 w-28 border-r border-gray-200">마감일 ⬇</th>
                <th className="py-3 px-3 w-20">D-day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {filteredList.map((notice) => (
                <tr key={notice.id} className="hover:bg-blue-50/20">
                  <td className="py-3 px-3 border-r border-gray-200">
                    <input
                      type="checkbox"
                      checked={checkedItems.includes(notice.id)}
                      onChange={() => handleItemCheck(notice.id)}
                    />
                  </td>
                  <td className="py-3 px-3 text-gray-600 border-r border-gray-200">{notice.id}</td>
                  <td className="py-3 px-4 border-r border-gray-200 font-bold">
                    <span className={notice.status === '접수중' ? 'text-red-500' : 'text-[#0070d2]'}>
                      {notice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left font-medium text-gray-800 border-r border-gray-200 hover:underline cursor-pointer">
                    {notice.title}
                  </td>
                  <td className="py-3 px-4 text-gray-600 border-r border-gray-200">{notice.dept}</td>
                  <td className="py-3 px-3 text-gray-500 border-r border-gray-200">{notice.rcptBg}</td>
                  <td className="py-3 px-3 text-gray-500 border-r border-gray-200">{notice.rcptEnd}</td>
                  <td className="py-3 px-3 font-semibold text-gray-700">{notice.dday}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}