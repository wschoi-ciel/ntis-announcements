// app/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RotateCcw, Calendar, ArrowLeft, Paperclip, ChevronRight } from 'lucide-react';

const DEPARTMENTS = [
  '개인정보보호위원회', '경찰청', '고용노동부', '고준위방사성폐기물관리위원회', '공정거래위원회', '과학기술정보통신부', '교육부', '국가데이터처',
  '국가보훈부', '국가유산청', '국무조정실', '국방부', '국토교통부', '국회', '기상청', '기획예산처', '기획재정부', '기후에너지환경부',
  '농림축산식품부', '농촌진흥청', '대통령경호처', '대통령비서실', '문화재청', '문화체육관광부', '방송미디어통신위원회', '방위사업청', '법무부', '법제처',
  '보건복지부', '산림청', '산업통상부', '성평등가족부', '소방청', '식품의약품안전처', '외교부', '우주항공청', '원자력안전위원회', '재정경제부',
  '중소벤처기업부', '지식재산처', '질병관리청', '통일부', '해양경찰청', '해양수산부', '행정안전부', '다부처', '기타'
];

interface NoticeDetail {
  id: number | string;
  status: string;
  title: string;
  dept: string;
  rcptBg: string;
  rcptEnd: string;
  dday: string;
  noticeType: string;
  agency: string;
  irisUrl: string;
  noticeDate: string;
  rcptEndTime: string;
  noticeCategory: string;
  budget: string;
  contact: string;
  projectName: string;
  files: string[];
  content: string;
}

export default function Home() {
  const [noticeType, setNoticeType] = useState('전체');
  const [noticeStatus, setNoticeStatus] = useState('전체');
  const [selectedDept, setSelectedDept] = useState('전체');
  const [keyword, setKeyword] = useState('');
  
  const [notices, setNotices] = useState<NoticeDetail[]>([]);
  const [totalCount, setTotalCount] = useState<number>(77106);
  const [loading, setLoading] = useState(false);

  // 상세 페이지 조회를 위한 State
  const [selectedNotice, setSelectedNotice] = useState<NoticeDetail | null>(null);

  const [allChecked, setAllChecked] = useState(false);
  const [checkedItems, setCheckedItems] = useState<(string | number)[]>([]);

  // API 데이터 호출
  const loadNotices = useCallback(async (kw = keyword, dept = selectedDept) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (kw) query.append('keyword', kw);
      if (dept && dept !== '전체') query.append('dept', dept);

      const res = await fetch(`/api/announcements?${query.toString()}`);
      const data = await res.json();
      setNotices(data.items || []);
      setTotalCount(data.totalCount || 77106);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedDept]);

  useEffect(() => {
    loadNotices('', '전체');
  }, [loadNotices]);

  const handleDeptSelect = (dept: string) => {
    setSelectedDept(dept);
    setSelectedNotice(null);
    loadNotices(keyword, dept);
  };

  const handleReset = () => {
    setNoticeType('전체');
    setNoticeStatus('전체');
    setSelectedDept('전체');
    setKeyword('');
    setSelectedNotice(null);
    loadNotices('', '전체');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedNotice(null);
    loadNotices(keyword, selectedDept);
  };

  const handleCheckAll = () => {
    if (allChecked) {
      setCheckedItems([]);
    } else {
      setCheckedItems(filteredList.map(n => n.id));
    }
    setAllChecked(!allChecked);
  };

  const handleItemCheck = (id: string | number) => {
    setCheckedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredList = useMemo(() => {
    return notices.filter(n => {
      if (noticeStatus === '전체') return true;
      if (noticeStatus === '마감') return n.status === '마감' || n.dday === '마감';
      if (noticeStatus === '접수예정') return n.status === '접수예정';
      if (noticeStatus === '접수중') return n.status === '접수중' || (!n.status.includes('예정') && n.dday !== '마감');
      return true;
    });
  }, [notices, noticeStatus]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#333] font-sans pb-20">
      {/* 1. 최상단 타이틀 */}
      <div className="max-w-[1240px] mx-auto pt-6 pb-2 px-4 flex items-center justify-between">
        <h1 
          className="text-2xl font-black text-black tracking-tight cursor-pointer"
          onClick={() => setSelectedNotice(null)}
        >
          국가R&D통합공고
        </h1>
        {selectedNotice && (
          <button
            onClick={() => setSelectedNotice(null)}
            className="flex items-center gap-1 text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
          </button>
        )}
      </div>

      <main className="max-w-[1240px] mx-auto px-4 space-y-4">
        {/* 공고 상세 페이지 화면 (두 번째 첨부파일 레이아웃 100% 재현) */}
        {selectedNotice ? (
          <div className="bg-white border border-[#d8dce2] rounded-none p-8 space-y-6 shadow-sm">
            {/* 타이틀 및 밑줄 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedNotice.title}</h2>
              <div className="border-b-2 border-black"></div>
            </div>

            {/* 기본 상세 정보 테이블 영역 */}
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex gap-12">
                  <span><strong className="font-semibold text-gray-700">공고형태 :</strong> {selectedNotice.noticeType}</span>
                  <span><strong className="font-semibold text-gray-700">부처명 :</strong> {selectedNotice.dept}</span>
                  <span><strong className="font-semibold text-gray-700">공고기관명 :</strong> {selectedNotice.agency}</span>
                </div>
                <a
                  href={selectedNotice.irisUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0070d2] text-white px-5 py-2 font-bold text-xs rounded-full flex items-center gap-1 hover:bg-[#005bb5] transition shadow-sm"
                >
                  IRIS 바로가기 ▶
                </a>
              </div>

              <div className="bg-[#f5f6f8] p-3 flex gap-12 text-gray-700 rounded-none">
                <span><strong className="font-semibold">공고일 :</strong> {selectedNotice.noticeDate}</span>
                <span><strong className="font-semibold">접수일 :</strong> {selectedNotice.rcptBg}</span>
                <span><strong className="font-semibold">마감일 :</strong> {selectedNotice.rcptEnd}</span>
                <span><strong className="font-semibold">접수마감시간 :</strong> {selectedNotice.rcptEndTime}</span>
              </div>

              <div className="flex gap-12 py-2 text-gray-700">
                <span><strong className="font-semibold">공고유형 :</strong> {selectedNotice.noticeCategory}</span>
                <span><strong className="font-semibold">공고금액 :</strong> {selectedNotice.budget}</span>
              </div>

              <div className="bg-[#f5f6f8] p-3 text-gray-700">
                <span><strong className="font-semibold">문의처 :</strong> {selectedNotice.contact}</span>
              </div>

              <div className="py-2 text-gray-700">
                <span><strong className="font-semibold">사업명 :</strong> {selectedNotice.projectName}</span>
              </div>
            </div>

            {/* 첨부파일 박스 */}
            <div className="border border-gray-300 rounded p-4 text-[13px] bg-white flex gap-4">
              <span className="font-bold text-gray-700 whitespace-nowrap pt-0.5">첨부파일</span>
              <div className="space-y-1.5 flex-1">
                {selectedNotice.files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 cursor-pointer">
                    <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                    <span className="hover:underline">{file}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 공고 내용 및 링크 안내 */}
            <div className="pt-4 space-y-4 text-[13px]">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">공고내용</h3>
                <span className="text-red-500 text-xs">※ 자세한 내용은 <a href={selectedNotice.irisUrl} target="_blank" rel="noreferrer" className="underline font-bold text-blue-600">IRIS 사업공고</a>에서 확인하시기 바랍니다.</span>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 min-h-[120px] text-gray-600 leading-relaxed">
                {selectedNotice.content}
              </div>
            </div>
          </div>
        ) : (
          /* 기존 메인 목록 화면 */
          <>
            {/* 조건 선택 박스 (격자형) */}
            <div className="border border-[#c7cdd5] bg-white text-[12px] shadow-sm">
              {/* 공고형태 */}
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
                      className={`py-2 ${noticeType === type ? 'bg-[#ff6000] text-white font-bold' : 'hover:bg-gray-50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 공고현황 */}
              <div className="grid grid-cols-[120px_1fr] border-b border-[#e1e4e8]">
                <div className="bg-[#f0f2f5] font-bold text-gray-700 flex items-center justify-between px-4 border-r border-[#e1e4e8]">
                  <span>공고현황</span>
                  <span className="text-[10px] text-gray-400">▶</span>
                </div>
                <div className="grid grid-cols-4 divide-x divide-[#e1e4e8] text-center">
                  {['전체', '접수예정', '접수중', '마감'].map(st => (
                    <button
                      key={st}
                      onClick={() => setNoticeStatus(st)}
                      className={`py-2 ${noticeStatus === st ? 'bg-[#ff6000] text-white font-bold' : 'hover:bg-gray-50'}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* 부처명 그리드 */}
              <div className="grid grid-cols-[120px_1fr]">
                <div className="bg-[#f0f2f5] font-bold text-gray-700 flex items-center justify-between px-4 border-r border-[#e1e4e8]">
                  <span>부처명</span>
                  <span className="text-[10px] text-gray-400">▶</span>
                </div>
                <div className="p-0">
                  <div className="grid grid-cols-8 divide-x divide-y divide-[#e1e4e8] text-center border-b border-[#e1e4e8]">
                    <button
                      onClick={() => handleDeptSelect('전체')}
                      className={`py-2 font-bold ${selectedDept === '전체' ? 'bg-[#ff6000] text-white' : 'hover:bg-gray-50'}`}
                    >
                      전체
                    </button>
                    {DEPARTMENTS.slice(0, 46).map((dept) => (
                      <button
                        key={dept}
                        onClick={() => handleDeptSelect(dept)}
                        title={dept}
                        className={`py-2 px-1 truncate transition-colors ${
                          selectedDept === dept ? 'bg-[#ff6000] text-white font-bold' : 'hover:bg-gray-50'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
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

            {/* 안내 문구 */}
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

            {/* 검색 상세 바 */}
            <form onSubmit={handleSearch} className="border border-[#c7cdd5] bg-[#fbfcfd] p-4 text-[12px] space-y-3 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="w-16 font-bold text-gray-700">키워드</span>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="국가R&D통합공고 키워드 검색"
                    className="w-full max-w-xl px-3 py-1.5 border border-gray-300 bg-white focus:outline-none focus:border-blue-500"
                  />
                  <label className="flex items-center gap-1 cursor-pointer text-gray-600">
                    <input type="checkbox" /> 공고기관 검색
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-gray-600">
                    <input type="checkbox" /> 첨부파일명 검색
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="w-16 font-bold text-gray-700">공고일</span>
                <div className="flex items-center gap-1">
                  <input type="text" className="w-24 px-2 py-1.5 border border-gray-300 bg-white" />
                  <button type="button" className="p-1.5 border border-gray-300 bg-gray-100 text-gray-600"><Calendar className="w-3.5 h-3.5" /></button>
                  <span>~</span>
                  <input type="text" className="w-24 px-2 py-1.5 border border-gray-300 bg-white" />
                  <button type="button" className="p-1.5 border border-gray-300 bg-gray-100 text-gray-600"><Calendar className="w-3.5 h-3.5" /></button>
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

                <button
                  type="submit"
                  className="ml-auto px-8 py-1.5 bg-[#0070d2] text-white font-bold hover:bg-[#005bb5] transition-colors"
                >
                  검색
                </button>
              </div>
            </form>

            {/* 검색결과 카운트 (중간 네모 3개 버튼 완전 삭제 완료) */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-base font-bold">
                검색결과 <span className="text-[#0070d2]">{totalCount.toLocaleString()}</span>건
              </div>
            </div>

            {/* 공고 테이블 */}
            <div className="border-t-2 border-black border-b border-[#c7cdd5] bg-white overflow-x-auto text-[12px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f9fafb] border-b border-gray-200 text-gray-600 text-center font-bold">
                    <th className="py-3 px-3 w-10 border-r border-gray-200">
                      <input type="checkbox" checked={allChecked} onChange={handleCheckAll} />
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
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-gray-400">
                        공고 정보를 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-gray-400">
                        조회된 공고 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((notice) => (
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
                          <span className={notice.status === '접수중' ? 'text-red-500' : notice.status === '마감' ? 'text-gray-400' : 'text-[#0070d2]'}>
                            {notice.status}
                          </span>
                        </td>
                        {/* 공고명 클릭 시 상세 페이지로 전환 */}
                        <td 
                          className="py-3 px-4 text-left font-medium text-gray-800 border-r border-gray-200 hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={() => setSelectedNotice(notice)}
                        >
                          {notice.title}
                        </td>
                        <td className="py-3 px-4 text-gray-600 border-r border-gray-200">{notice.dept}</td>
                        <td className="py-3 px-3 text-gray-500 border-r border-gray-200">{notice.rcptBg}</td>
                        <td className="py-3 px-3 text-gray-500 border-r border-gray-200">{notice.rcptEnd}</td>
                        <td className="py-3 px-3 font-semibold text-gray-700">{notice.dday}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}