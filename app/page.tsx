'use client';

import { useState, useMemo } from 'react';
import { Search, RotateCcw, ExternalLink, Calendar } from 'lucide-react';

// 부처 목록 정의
const DEPARTMENTS = [
  '전체', '다부처', '과학기술정보통신부', '산업통상자원부', '중소벤처기업부', 
  '기후에너지환경부', '보건복지부', '교육부', '국토교통부', '농림축산식품부', 
  '해양수산부', '행정안전부', '방위사업청', '식품의약품안전처', '기상청', 
  '농촌진흥청', '산림청', '소방청', '질병관리청', '해양경찰청', '특허청', '기타'
];

const STATUS_LIST = ['전체', '접수예정', '접수중', '마감'];

interface NoticeItem {
  ancmId?: string;
  ancmNm: string;
  deptNm?: string;
  rcptBgDt?: string; // 접수시작일 (YYYY.MM.DD 또는 YYYYMMDD)
  rcptEndDt?: string; // 접수마감일
  status?: string;
  dtlUrl?: string;
}

// D-day 계산 함수
function calculateDday(endDateStr?: string) {
  if (!endDateStr) return '-';
  const cleanDate = endDateStr.replace(/[^0-9]/g, '');
  if (cleanDate.length < 8) return '-';

  const year = parseInt(cleanDate.substring(0, 4), 10);
  const month = parseInt(cleanDate.substring(4, 6), 10) - 1;
  const day = parseInt(cleanDate.substring(6, 8), 10);

  const end = new Date(year, month, day);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '마감';
  if (diffDays === 0) return 'D-Day';
  return `D-${diffDays}`;
}

export default function Home() {
  const [selectedDept, setSelectedDept] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);

  // API 데이터 호출
  const fetchNotices = async (queryKeyword = keyword, queryDept = selectedDept) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (queryKeyword) params.append('keyword', queryKeyword);
      if (queryDept !== '전체') params.append('dept', queryDept);

      const res = await fetch(`/api/announcements?${params.toString()}`);
      const result = await res.json();
      
      const items = result?.response?.body?.items?.item || [];
      const parsedItems = Array.isArray(items) ? items : [items];
      setNotices(parsedItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 초기화 핸들러
  const handleReset = () => {
    setSelectedDept('전체');
    setSelectedStatus('전체');
    setKeyword('');
    fetchNotices('', '전체');
  };

  // 클라이언트 사이드 상태 및 필터링 (NTIS API 응답 보정)
  const filteredNotices = useMemo(() => {
    return notices.filter((item) => {
      // 부처 필터
      if (selectedDept !== '전체') {
        if (selectedDept === '다부처' && !item.deptNm?.includes('다부처')) return false;
        if (selectedDept !== '다부처' && item.deptNm !== selectedDept) return false;
      }
      // 상태 필터
      if (selectedStatus !== '전체') {
        const dday = calculateDday(item.rcptEndDt);
        if (selectedStatus === '마감' && dday !== '마감') return false;
        if (selectedStatus === '접수중' && (dday === '마감' || item.status === '접수예정')) return false;
        if (selectedStatus === '접수예정' && item.status !== '접수예정') return false;
      }
      return true;
    });
  }, [notices, selectedDept, selectedStatus]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#333]">
      {/* 최상단 타이틀 */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900">국가R&D 통합공고 조회 시스템</h1>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12 space-y-4">
        {/* 필터 영역 박스 */}
        <div className="bg-white border border-gray-300 rounded shadow-sm text-xs">
          
          {/* 1. 공고현황 필터 */}
          <div className="flex border-b border-gray-200">
            <div className="w-28 bg-[#f4f6f9] font-semibold text-gray-700 p-3 flex items-center justify-center border-r border-gray-200">
              공고현황
            </div>
            <div className="flex flex-wrap gap-1 p-2">
              {STATUS_LIST.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-1.5 rounded transition ${
                    selectedStatus === status
                      ? 'bg-[#ff6b00] text-white font-bold'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 부처명 그리드 선택기 */}
          <div className="flex">
            <div className="w-28 bg-[#f4f6f9] font-semibold text-gray-700 p-3 flex items-center justify-center border-r border-gray-200">
              부처명
            </div>
            <div className="flex-1 p-2">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => {
                      setSelectedDept(dept);
                      fetchNotices(keyword, dept);
                    }}
                    className={`py-1.5 px-2 text-center truncate rounded transition ${
                      selectedDept === dept
                        ? 'bg-[#ff6b00] text-white font-bold'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                    title={dept}
                  >
                    {dept}
                  </button>
                ))}
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 font-semibold"
                >
                  <RotateCcw className="h-3 w-3" /> 초기화
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 검색 입력창 */}
        <div className="bg-white border border-gray-300 rounded p-4 flex gap-3 shadow-sm">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="국가R&D 통합공고 키워드 검색 (예: 인공지능, 이차전지, 바이오)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchNotices(keyword, selectedDept)}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => fetchNotices(keyword, selectedDept)}
            className="px-6 py-2 bg-[#0070d2] text-white rounded text-sm font-semibold flex items-center gap-1 hover:bg-[#005bb5] transition"
          >
            <Search className="h-4 w-4" /> 검색
          </button>
        </div>

        {/* 4. 검색 결과 테이블 */}
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-sm font-semibold text-gray-700">
            <span>검색결과: {filteredNotices.length} 건</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#f4f6f9] border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="py-2.5 px-4 text-center w-16">순번</th>
                  <th className="py-2.5 px-4 text-center w-24">현황</th>
                  <th className="py-2.5 px-4">공고명</th>
                  <th className="py-2.5 px-4 text-center w-36">소관부처</th>
                  <th className="py-2.5 px-4 text-center w-28">접수일</th>
                  <th className="py-2.5 px-4 text-center w-28">마감일</th>
                  <th className="py-2.5 px-4 text-center w-20">D-day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : filteredNotices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      조회된 공고 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredNotices.map((notice, idx) => {
                    const dday = calculateDday(notice.rcptEndDt);
                    return (
                      <tr key={notice.ancmId || idx} className="hover:bg-blue-50/40 transition">
                        <td className="py-3 px-4 text-center text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              dday === '마감'
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                          >
                            {dday === '마감' ? '마감' : '접수중'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          <div className="flex items-center gap-1.5">
                            <span className="hover:underline cursor-pointer">{notice.ancmNm}</span>
                            {notice.dtlUrl && (
                              <a
                                href={notice.dtlUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-blue-600 inline-block"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{notice.deptNm || '-'}</td>
                        <td className="py-3 px-4 text-center text-gray-500">{notice.rcptBgDt || '-'}</td>
                        <td className="py-3 px-4 text-center text-gray-500">{notice.rcptEndDt || '-'}</td>
                        <td className="py-3 px-4 text-center font-bold text-[#ff6b00]">{dday}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}