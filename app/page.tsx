// app/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw, ExternalLink } from 'lucide-react';

const DEPARTMENTS = [
  '전체', '다부처', '과학기술정보통신부', '산업통상자원부', '중소벤처기업부', 
  '기후에너지환경부', '보건복지부', '교육부', '국토교통부', '농림축산식품부', 
  '해양수산부', '행정안전부', '방위사업청', '식품의약품안전처', '기상청', 
  '농촌진흥청', '산림청', '소방청', '질병관리청', '특허청', '기타'
];

const STATUS_LIST = ['전체', '접수예정', '접수중', '마감'];

interface NoticeItem {
  ancmId?: string;
  ancmNm: string;
  deptNm?: string;
  rcptBgDt?: string;
  rcptEndDt?: string;
  status?: string;
  dtlUrl?: string;
}

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

  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

  const loadData = async (kw = keyword, dept = selectedDept) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (kw) query.append('keyword', kw);
      if (dept && dept !== '전체') query.append('dept', dept);

      const res = await fetch(`/api/announcements?${query.toString()}`);
      const data = await res.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 최초 페이지 진입 시 전체 공고 즉시 로드
  useEffect(() => {
    loadData('', '전체');
  }, []);

  const handleReset = () => {
    setSelectedDept('전체');
    setSelectedStatus('전체');
    setKeyword('');
    loadData('', '전체');
  };

  const filteredNotices = useMemo(() => {
    return notices.filter((item) => {
      if (selectedDept !== '전체') {
        if (selectedDept === '다부처' && !item.deptNm?.includes('다부처')) return false;
        if (selectedDept !== '다부처' && item.deptNm !== selectedDept) return false;
      }
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
    <div className="min-h-screen bg-[#f5f6f8] text-[#333]">
      <header className="bg-white border-b border-gray-200 py-3 px-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">국가R&D 통합공고</h1>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* 필터 영역 */}
        <div className="bg-white border border-gray-300 rounded shadow-sm text-xs">
          {/* 현황 */}
          <div className="flex border-b border-gray-200">
            <div className="w-24 bg-[#f8f9fa] font-semibold text-gray-700 p-2.5 flex items-center justify-center border-r border-gray-200">
              공고현황
            </div>
            <div className="flex flex-wrap gap-1 p-2">
              {STATUS_LIST.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded transition ${
                    selectedStatus === st
                      ? 'bg-[#ff6b00] text-white font-bold'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* 부처 그리드 */}
          <div className="flex">
            <div className="w-24 bg-[#f8f9fa] font-semibold text-gray-700 p-2.5 flex items-center justify-center border-r border-gray-200">
              부처명
            </div>
            <div className="flex-1 p-2">
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-1">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => {
                      setSelectedDept(dept);
                      loadData(keyword, dept);
                    }}
                    className={`py-1 px-1.5 text-center truncate rounded transition ${
                      selectedDept === dept
                        ? 'bg-[#ff6b00] text-white font-bold'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1 py-1 px-1.5 text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 font-semibold"
                >
                  <RotateCcw className="h-3 w-3" /> 초기화
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 키워드 검색 */}
        <div className="bg-white border border-gray-300 rounded p-3 flex gap-2 shadow-sm">
          <input
            type="text"
            placeholder="국가R&D통합공고 키워드 검색 (예: 에너지, 인공지능, 공모)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData(keyword, selectedDept)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => loadData(keyword, selectedDept)}
            className="px-5 py-1.5 bg-[#0070d2] text-white text-sm font-semibold rounded hover:bg-[#005bb5] transition flex items-center gap-1"
          >
            <Search className="h-4 w-4" /> 검색
          </button>
        </div>

        {/* 공고 테이블 */}
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
          <div className="p-3 bg-[#f8f9fa] border-b border-gray-200 text-xs font-semibold text-gray-700">
            검색결과 <span className="text-[#0070d2] font-bold">{filteredNotices.length}</span>건
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#f4f6f9] border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-center w-16">순번</th>
                  <th className="py-2.5 px-3 text-center w-24">현황</th>
                  <th className="py-2.5 px-4">공고명</th>
                  <th className="py-2.5 px-3 text-center w-36">부처명</th>
                  <th className="py-2.5 px-3 text-center w-28">접수일</th>
                  <th className="py-2.5 px-3 text-center w-28">마감일</th>
                  <th className="py-2.5 px-3 text-center w-20">D-day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : filteredNotices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      해당 조건의 공고가 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  filteredNotices.map((item, idx) => {
                    const dday = calculateDday(item.rcptEndDt);
                    const isUpcoming = item.status === '접수예정';
                    return (
                      <tr key={item.ancmId || idx} className="hover:bg-blue-50/30 transition">
                        <td className="py-2.5 px-3 text-center text-gray-500">{item.ancmId || idx + 1}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                              isUpcoming
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : dday === '마감'
                                ? 'bg-gray-100 text-gray-400'
                                : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                          >
                            {isUpcoming ? '접수예정' : dday === '마감' ? '마감' : '접수중'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-gray-800">
                          <div className="flex items-center gap-1.5">
                            <span className="hover:underline cursor-pointer">{item.ancmNm}</span>
                            {item.dtlUrl && item.dtlUrl !== '#' && (
                              <a
                                href={item.dtlUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-blue-600 inline-block"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-600">{item.deptNm || '-'}</td>
                        <td className="py-2.5 px-3 text-center text-gray-500">{item.rcptBgDt || '-'}</td>
                        <td className="py-2.5 px-3 text-center text-gray-500">{item.rcptEndDt || '-'}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#ff6b00]">{dday}</td>
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